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
        fail_open: bool = True,
    ):
        self.enabled = True
        try:
            self.pep = PolicyEnforcementPoint(timeout_seconds=timeout_seconds)
            log(INFO, "ExternalAccessControlValidator (PEP) initialized")
        except Exception as e:
            log(ERROR, "Failed to initialize PolicyEnforcementPoint: %s", e)
            if fail_open:
                log(WARNING, "Fail-open mode: disabling enforcement (validator will allow)")
                self.enabled = False
            else:
                raise

    def is_allowed_full_training(self, node_id: Optional[int] = None) -> Tuple[bool, str]:
        try:
            allowed = self.pep.check_node_allowed_full_training(node_id)
            return (True, "Allowed by PEP") if allowed else (False, "Denied by PEP")
        except Exception as e:  # pragma: no cover - defensive
            log(WARNING, "PEP call failed: %s", e)
            return True, "PEP error - allowing by default"

    def is_allowed_to_evaluate(self, node_id: Optional[int] = None) -> Tuple[bool, str]:
        """Check whether a node is allowed to perform evaluation tasks
        """

        try:
            allowed = self.pep.check_node_allowed_to_evaluate(node_id)
            return (True, "Allowed by PEP") if allowed else (False, "Denied by PEP")
        except Exception as e:  # pragma: no cover - defensive
            log(WARNING, "PEP call (evaluate) failed: %s", e)
            return True, "PEP error - allowing by default"

    