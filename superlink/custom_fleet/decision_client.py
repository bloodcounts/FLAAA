"""Policy Enforcement Point (PEP) that queries an external PDP endpoint."""

import json
import logging
import os
import ssl
import time
from typing import Optional
from urllib import request, parse, error

logger = logging.getLogger(__name__)


class PolicyEnforcementPoint:
    """Contacts an external policy decision endpoint to determine full-training eligibility.

    The PEP calls the external URL with the specific query params requested and
    returns True when the external service permits the node to join full training.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        task_id: Optional[str] = None,
        timeout_seconds: int = 5,
        retry_count: int = 2,
    ):
        self.endpoint = (endpoint or os.getenv("EXTERNAL_ACL_API_ENDPOINT", "")).strip()
        self.task_id = (task_id or os.getenv("EXTERNAL_ACL_TASK_ID", "")).strip()
        if not self.endpoint or not self.endpoint.startswith("https://"):
            raise ValueError("A HTTPS EXTERNAL_ACL_API_ENDPOINT is required")
        if not self.task_id:
            raise ValueError("EXTERNAL_ACL_TASK_ID is required")
        self.expected_policy_version = os.getenv("EXTERNAL_ACL_POLICY_VERSION", "").strip()
        self.expected_policy_digest = os.getenv("EXTERNAL_ACL_POLICY_SHA256", "").strip().lower()
        self.timeout_seconds = timeout_seconds
        self.retry_count = retry_count
        ca_cert_path = os.getenv("PDP_CA_CERT_PATH", "").strip()
        self.ssl_context = ssl.create_default_context(cafile=ca_cert_path or None)

    def _record_local_failure(self, params: dict, failure: str) -> None:
        """Write an operator-visible PEP failure record when the PDP cannot."""
        path = os.getenv("PEP_FAILURE_LOG_PATH", "").strip()
        if not path:
            return
        record = {
            "timestamp": time.time(),
            "outcome": "Deny",
            "source": "PEP",
            "failure": failure,
            "action": params.get("action"),
            "task_id": params.get("task_id"),
            "node_id": params.get("node_id"),
        }
        try:
            with open(path, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(record, sort_keys=True) + "\n")
        except OSError as exc:
            logger.error("Could not write PEP failure record: %s", exc)
    def _call_pdp(self, params: dict) -> tuple[int, object]:
        """Perform the HTTP GET against the PDP and return (status, parsed_body_or_text).

        This helper centralizes HTTP call and JSON parsing.
        """
        query = parse.urlencode(params)
        url = f"{self.endpoint}?{query}"
        last_failure = "unknown"
        # ``timeout_seconds`` is passed to every HTTP attempt independently;
        # it is not a whole-decision deadline across retries.
        for attempt in range(self.retry_count + 1):
            try:
                req = request.Request(url, method="GET")
                with request.urlopen(req, timeout=self.timeout_seconds, context=self.ssl_context) as resp:
                    status = resp.getcode()
                    body = resp.read().decode("utf-8")
                    try:
                        data = json.loads(body)
                    except json.JSONDecodeError:
                        data = body
                    return status, data
            except error.URLError as exc:
                last_failure = type(exc).__name__
                logger.warning("PEP request failed (attempt %d/%d): %s", attempt + 1, self.retry_count + 1, exc)
            except Exception as exc:  # pragma: no cover - defensive
                last_failure = type(exc).__name__
                logger.exception("Unexpected PEP error (attempt %d/%d): %s", attempt + 1, self.retry_count + 1, exc)
        self._record_local_failure(params, last_failure)
        return 0, None

    def get_pdp_decision(self, node_id: Optional[int] = None, action: Optional[str] = None) -> dict:
        """Return a structured decision dictionary from the PDP response.

        The returned dict has keys:
        - `decision`: canonical string decision (e.g. 'Permit'/'Deny' or None)
        - `allow`: boolean if determinable, else None
        - `obligations`: list when present (possibly parsed from string)
        - `attributes`: value from response when present
        - `raw`: original parsed JSON or text
        - `status`: HTTP status code (0 for network errors)

        This function is tolerant to several JSON shapes, including the example
        provided where the top-level contains a `decision` object.
        """
        params = {"action": "train", "task_id": self.task_id}
        if action:
            params["action"] = action
        if node_id is not None:
            params["node_id"] = str(node_id)

        status, data = self._call_pdp(params)

        result = {
            "decision": None,
            "allow": None,
            "obligations": [],
            "attributes": None,
            "raw": data,
            "status": status,
            "policy": None,
            "policy_mismatch": False,
        }

        if status != 200:
            if status != 0:
                self._record_local_failure(params, f"http-status-{status}")
            return result

        # A valid decision must be structured.  Never infer Permit from a
        # substring in an error/plain-text response (for example ``not allow``).
        if isinstance(data, str):
            self._record_local_failure(params, "malformed-response")
            return result

        if not isinstance(data, dict):
            self._record_local_failure(params, "malformed-response")
            return result

        result["policy"] = data.get("policy") if isinstance(data.get("policy"), dict) else None
        if self.expected_policy_version or self.expected_policy_digest:
            policy = result["policy"] or {}
            version_ok = not self.expected_policy_version or policy.get("version") == self.expected_policy_version
            digest_ok = not self.expected_policy_digest or str(policy.get("sha256", "")).lower() == self.expected_policy_digest
            if not (version_ok and digest_ok):
                # A permit from an unexpected policy version cannot be used.
                result.update({"decision": "Deny", "allow": False, "policy_mismatch": True})
                return result

        # Accept only the canonical XACML decision in the supported flat or
        # nested schema. Boolean aliases must not override Deny/Indeterminate.
        inner = data.get("decision") if isinstance(data.get("decision"), dict) else data
        decision = inner.get("decision")
        canonical = decision in ("Permit", "Deny", "Indeterminate", "NotApplicable") if isinstance(decision, str) else False
        result["decision"] = decision if canonical else None
        result["allow"] = canonical and decision == "Permit"
        if any("allow" in block and (type(block["allow"]) is not bool or block["allow"] != result["allow"])
               for block in (data, inner)):
            result.update({"decision": "Deny", "allow": False})
            self._record_local_failure(params, "conflicting-decision-response")
        elif not canonical:
            self._record_local_failure(params, "malformed-decision-response")

        # obligations may come as stringified JSON
        obligations = inner.get("obligations") or inner.get("Obligations") or data.get("obligations")
        if isinstance(obligations, str):
            try:
                parsed = json.loads(obligations)
                result["obligations"] = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                result["obligations"] = [obligations]
        elif isinstance(obligations, list):
            result["obligations"] = obligations

        # attributes may be present as JSON/list
        attrs = inner.get("attributes") or data.get("attributes") or inner.get("attributes")
        result["attributes"] = attrs

        return result

    def check_node_allowed_full_training(self, node_id: Optional[int] = None, action: Optional[str] = None) -> bool:
        """Return True if node is allowed to join full training (train/aggregate/evaluate).

        If `action` is provided it will override the fixed `action` query param
        for the PDP call (e.g. 'evaluate').
        """
        decision = self.get_pdp_decision(node_id=node_id, action=action)
        return (decision.get("status") == 200
                and decision.get("decision") == "Permit"
                and decision.get("allow") is True)

    def check_node_allowed_to_evaluate(self, node_id: Optional[int] = None) -> bool:
        """Return True if node is allowed to perform evaluation.

        This uses the same query parameters as `check_node_allowed_full_training`.
        """

        # Do NOT mutate the shared FIXED_PARAMS dict (which would affect
        # subsequent calls). Instead, call the full-training check with the
        # explicit `action` override so the request uses `action=evaluate` for
        # this call only.
        return self.check_node_allowed_full_training(node_id=node_id, action="evaluate")
