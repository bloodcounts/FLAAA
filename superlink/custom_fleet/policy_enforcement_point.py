"""Study-approval PEP for the custom Flower coordinator."""
import os

from .decision_client import PolicyEnforcementPoint as DecisionClient


class PolicyEnforcementPoint:
    """Check the configured study at the coordinator's GetRun boundary."""

    def __init__(self, base_url=None, timeout=5):
        self.client = DecisionClient(
            endpoint=base_url or os.getenv("PDP_DECISION_URL") or os.getenv("EXTERNAL_ACL_API_ENDPOINT"),
            task_id=os.getenv("EXTERNAL_ACL_TASK_ID"),
            timeout_seconds=timeout,
            retry_count=int(os.getenv("EXTERNAL_ACL_RETRY_COUNT", "2")),
        )

    def is_task_approved(self, task_id):
        # A coordinator deployment is bound to EXTERNAL_ACL_TASK_ID. Flower's
        # numeric run id identifies execution, not an approved study.
        decision = self.client.get_pdp_decision(action="task_approval")
        approved = (decision["status"] == 200 and decision["decision"] == "Permit"
                    and decision["allow"] is True)
        return approved, decision
