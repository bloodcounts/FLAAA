"""Custom Fleet Servicer - simplified without state wrapper."""

import grpc
from flwr.common.logger import log
from logging import INFO, ERROR, WARNING, DEBUG

from flwr.server.superlink. fleet. grpc_rere. fleet_servicer import FleetServicer
from flwr.proto.fleet_pb2 import (
    PullMessagesRequest,
    PullMessagesResponse,
    PushMessagesRequest,
    PushMessagesResponse,
)
from flwr.proto.run_pb2 import GetRunRequest, GetRunResponse
from flwr.server.superlink.fleet.message_handler. message_handler import InvalidRunStatusException
from flwr.server.superlink.utils import abort_grpc_context

from .policy_enforcement_point import PolicyEnforcementPoint


class CustomFleetServicer(FleetServicer):
    """Extended Fleet Servicer with access control checks."""
    
    def __init__(
        self,
        state_factory,
        ffs_factory,
        objectstore_factory,
        enable_supernode_auth:  bool,
    ):
        """Initialize Custom Fleet Servicer."""
        super().__init__(
            state_factory,
            ffs_factory,
            objectstore_factory,
            enable_supernode_auth,
        )
        log(INFO, "CustomFleetServicer initialized (access control disabled)")
        # Policy Enforcement Point for external task approval
        self.pep = PolicyEnforcementPoint()
    
    def GetRun(self, request:  GetRunRequest, context: grpc.ServicerContext) -> GetRunResponse:
        """Get run with task authorization."""
        run_id = request.run_id
        log(INFO, "🔍 [GetRun] Task info requested for run_id=%s", run_id)
        
        state = self.state_factory.state()
        run = state.get_run(run_id)
        
        if not run:
            log(ERROR, "[GetRun] ❌ Run %s not found", run_id)
            abort_grpc_context(f"Run {run_id} not found", context)
            raise RuntimeError
        
        # Check external task approval via PEP
        approved, decision = self.pep.is_task_approved(run_id)

        if not approved:
            # Log obligations/decision info if present
            log(ERROR, "[GetRun] ❌ TASK DENIED by PEP for run %s: %s", run_id, decision)
            context.abort(grpc.StatusCode.PERMISSION_DENIED, f"Task not authorized: {decision}")
            raise RuntimeError

        try:
            return super().GetRun(request, context)
        except (InvalidRunStatusException, ValueError) as e:
            abort_grpc_context(str(e), context)
            raise RuntimeError
    
    def PullMessages(
        self, request: PullMessagesRequest, context: grpc.ServicerContext
    ) -> PullMessagesResponse:
        """Pull Messages - allow all to receive tasks."""
        node_id = request.node. node_id
        log(DEBUG, "🔄 [PullMessages] Node %d polling", node_id)

        
        response = super().PullMessages(request, context)
        
        if response.messages_list:
            log(INFO, "📬 [PullMessages] Node %d received %d message(s)", 
                node_id, len(response.messages_list))
            
            state = self.state_factory.state()
            for msg in response.messages_list:
                run = state.get_run(msg.metadata.run_id)
                if run:
                    log(INFO, "[PullMessages] 📤 Delivering '%s' task to node %d in '%s'", 
                        msg.metadata.message_type, node_id, run.federation)
        
        return response
    
    def PushMessages(
        self, request: PushMessagesRequest, context: grpc.ServicerContext
    ) -> PushMessagesResponse:
        """Push Messages - accept all submissions (filtering done by strategy)."""
        node_id = request.node.node_id
        
        if not request.messages_list:
            return super().PushMessages(request, context)
        
        log(INFO, "📤 [PushMessages] Node %d submitting %d message(s)", 
            node_id, len(request.messages_list))
        
        state = self.state_factory.state()
        run_id = request.messages_list[0].metadata.run_id
        run = state.get_run(run_id)
        
        if not run:
            log(ERROR, "[PushMessages] Run %s not found", run_id)
            context.abort(grpc.StatusCode.NOT_FOUND, f"Run {run_id} not found")
            raise RuntimeError
        
        for msg in request.messages_list:
            if msg.metadata.message_type == "train":
                log(INFO, "[PushMessages] ✅ Node %d: Results will be aggregated (open mode)", node_id)
        
        log(INFO, "[PushMessages] ✅ Accepting all submissions")
        
        try:
            return super().PushMessages(request, context)
        except InvalidRunStatusException as e:
            abort_grpc_context(e.message, context)
            raise RuntimeError