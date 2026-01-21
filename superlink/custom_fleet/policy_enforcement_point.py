"""Policy Enforcement Point (PEP) for external task approval decisions.

This PEP sends a GET request to an external decision endpoint and
parses the returned JSON to determine Permit/Deny decisions.
"""

from typing import Tuple, Dict, Any
from urllib.request import Request, urlopen
from urllib.parse import urlencode
import json
from flwr.common.logger import log
from logging import INFO, WARNING


class PolicyEnforcementPoint:
    """Simple PEP that queries an external decision service.

    Example decision endpoint:
    https://paler-plenteous-ayanna.ngrok-free.dev/getDecision
    """

    def __init__(self, base_url: str = "https://paler-plenteous-ayanna.ngrok-free.dev/getDecision", timeout: int = 5):
        self.base_url = base_url
        self.timeout = timeout

    def is_task_approved(self, task_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if a task is approved by querying the external decision endpoint.

        Returns (approved: bool, decision_dict: dict).
        """
        task_id = "medical"
        params = {"action": "task_approval", "task_id": task_id}
        url = f"{self.base_url}?{urlencode(params)}"

        log(INFO, "PEP: Querying decision endpoint for task_id=%s", task_id)

        try:
            req = Request(url, headers={"User-Agent": "flwr-pep/1.0"})
            with urlopen(req, timeout=self.timeout) as resp:
                data = json.load(resp)

            # Expecting structure: {"decision": { ... , "decision": "Permit" }}
            decision_block = data.get("decision") or {}
            decision_value = decision_block.get("decision")

            approved = decision_value == "Permit"

            log(INFO, "PEP: decision for task_id=%s -> %s", task_id, decision_value)
            return approved, decision_block

        except Exception as e:
            log(WARNING, "PEP: Failed to query decision endpoint: %s", e)
            # Fail-closed by default: if we cannot obtain a decision, treat as Deny
            return False, {"error": str(e)}
