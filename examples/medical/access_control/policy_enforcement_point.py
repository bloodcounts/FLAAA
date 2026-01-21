"""Policy Enforcement Point (PEP) that queries an external PDP endpoint."""

import json
import logging
from typing import Optional
from urllib import request, parse, error

logger = logging.getLogger(__name__)


class PolicyEnforcementPoint:
    """Contacts an external policy decision endpoint to determine full-training eligibility.

    The PEP calls the external URL with the specific query params requested and
    returns True when the external service permits the node to join full training.
    """

    BASE_URL = "https://paler-plenteous-ayanna.ngrok-free.dev/getDecision"

    # Fixed query params required by the user request
    FIXED_PARAMS = {
        "action": "train",
        "task_id": "medical"
    }

    def __init__(self, timeout_seconds: int = 5):
        self.timeout_seconds = timeout_seconds
    def _call_pdp(self, params: dict) -> tuple[int, object]:
        """Perform the HTTP GET against the PDP and return (status, parsed_body_or_text).

        This helper centralizes HTTP call and JSON parsing.
        """
        query = parse.urlencode(params)
        url = f"{self.BASE_URL}?{query}"
        print(f"PEP: Calling PDP>>>>>>>>>>> at {url}")
        try:
            req = request.Request(url, method="GET")
            with request.urlopen(req, timeout=self.timeout_seconds) as resp:
                status = resp.getcode()
                body = resp.read().decode("utf-8")
                try:
                    data = json.loads(body)
                except Exception:
                    data = body
                return status, data
        except error.URLError as e:
            logger.warning("PEP request failed: %s", e)
            return 0, None
        except Exception as e:  # pragma: no cover - defensive
            logger.exception("Unexpected error contacting PEP: %s", e)
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
        params = dict(self.FIXED_PARAMS)
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
        }

        if status != 200:
            return result

        # If the response is plain text, attempt to detect 'allow'
        if isinstance(data, str):
            if "allow" in data.lower():
                result["allow"] = True
                result["decision"] = "Permit"
            return result

        if not isinstance(data, dict):
            return result

        # If PDP returned a nested 'decision' object (common in XACML-like responses)
        inner = data.get("decision") if isinstance(data.get("decision"), dict) else None
        if inner is None:
            # maybe `decision` is a string or there are top-level fields
            decision_str = data.get("decision") or data.get("result") or data.get("effect")
            if isinstance(decision_str, str):
                result["decision"] = decision_str
                result["allow"] = decision_str.lower() in ("permit", "allow", "approved", "yes")
            if "allow" in data and isinstance(data["allow"], bool):
                result["allow"] = data["allow"]
                if result["allow"]:
                    result["decision"] = result["decision"] or "Permit"
                else:
                    result["decision"] = result["decision"] or "Deny"
            result["attributes"] = data.get("attributes") or data.get("attributes")
            result["obligations"] = data.get("obligations") or []
            return result

        # inner is a dict
        # decision string
        if isinstance(inner.get("decision"), str):
            result["decision"] = inner.get("decision")
            result["allow"] = inner.get("decision").lower() in ("permit", "allow", "approved", "yes")

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
        if decision.get("allow") is not None:
            return bool(decision["allow"])
        # Fallback to string decision
        dec = decision.get("decision")
        if isinstance(dec, str):
            return dec.lower() in ("permit", "allow", "approved", "yes")
        return False

    def check_node_allowed_to_evaluate(self, node_id: Optional[int] = None) -> bool:
        """Return True if node is allowed to perform evaluation.

        This uses the same query parameters as `check_node_allowed_full_training`.
        """

        # Do NOT mutate the shared FIXED_PARAMS dict (which would affect
        # subsequent calls). Instead, call the full-training check with the
        # explicit `action` override so the request uses `action=evaluate` for
        # this call only.
        return self.check_node_allowed_full_training(node_id=node_id, action="evaluate")
