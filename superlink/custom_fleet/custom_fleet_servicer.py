"""Flower gRPC Fleet service with study approval enforced at GetRun."""
from logging import INFO, WARNING

import grpc
from flwr.common.logger import log
from flwr.server.superlink.fleet.grpc_rere.fleet_servicer import FleetServicer

from .policy_enforcement_point import PolicyEnforcementPoint


class CustomFleetServicer(FleetServicer):
    """Require PDP study approval before returning run information to a node."""

    def __init__(self, state_factory, objectstore_factory, enable_supernode_auth):
        super().__init__(state_factory, objectstore_factory, enable_supernode_auth)
        self.pep = PolicyEnforcementPoint()
        log(INFO, "Custom Fleet service initialized with study approval enforcement")

    def GetRun(self, request, context):
        approved, decision = self.pep.is_task_approved(request.run_id)
        if not approved:
            log(WARNING, "Study approval denied for run %s: %s", request.run_id, decision)
            context.abort(grpc.StatusCode.PERMISSION_DENIED, "Study approval denied by PDP")
            raise RuntimeError("Study approval denied")
        return super().GetRun(request, context)
