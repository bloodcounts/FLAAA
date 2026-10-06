"""Simpler External validator that delegates to the Policy Enforcement Point (PEP)."""

from typing import Tuple, Optional
from flwr.common.logger import log
from logging import INFO, ERROR, WARNING
import os

from .policy_enforcement_point import PolicyEnforcementPoint


class ExternalAccessControlValidator:
    """Validator wrapper around the PEP for full-training authorization.

    Accepts the same configuration keywords as the old validator for
    compatibility with `server_app.py`.
    """

    def __init__(
        self,
        timeout_seconds: int = 5,
        retry_count: int = 2,
        fail_open: bool = False,
    ):
        self.enabled = True
        try:
            if fail_open:
                raise ValueError("Fail-open enforcement is not supported")
            self.pep = PolicyEnforcementPoint(
                timeout_seconds=timeout_seconds, retry_count=retry_count
            )
            log(INFO, "ExternalAccessControlValidator (PEP) initialized")
        except Exception as e:
            log(ERROR, "Failed to initialize PolicyEnforcementPoint: %s", e)
            raise

    def is_allowed_full_training(self, node_id: Optional[int] = None, action: str = "train") -> Tuple[bool, str]:
        try:
            allowed = self.pep.check_node_allowed_full_training(node_id, action=action)
            return (True, "Allowed by PEP") if allowed else (False, "Denied by PEP")
        except Exception as e:  # pragma: no cover - defensive
            log(WARNING, "PEP call failed: %s", e)
            return False, "PEP error - denied (fail closed)"

    def is_task_authorized(self) -> Tuple[bool, str]:
        return self.is_allowed_full_training(node_id=None, action="task_approval")

    def is_node_activation_allowed(self, node_id: Optional[int]) -> Tuple[bool, str]:
        return self.is_allowed_full_training(node_id=node_id, action="membership_validation")

    def is_allowed_to_evaluate(self, node_id: Optional[int] = None) -> Tuple[bool, str]:
        """Check whether a node is allowed to perform evaluation tasks
        """

        try:
            allowed = self.pep.check_node_allowed_to_evaluate(node_id)
            return (True, "Allowed by PEP") if allowed else (False, "Denied by PEP")
        except Exception as e:  # pragma: no cover - defensive
            log(WARNING, "PEP call (evaluate) failed: %s", e)
            return False, "PEP error - denied (fail closed)"
