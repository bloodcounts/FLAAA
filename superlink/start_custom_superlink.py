"""Custom Flower SuperLink with External Access Control."""

import argparse
import grpc
import sys
import subprocess
import os
from pathlib import Path
from flwr.common.logger import log
from logging import INFO, ERROR
from typing import Optional

from flwr.server.superlink. linkstate import LinkStateFactory
from flwr.supercore.ffs import FfsFactory
from flwr.supercore.object_store import ObjectStoreFactory
from flwr.superlink.federation import NoOpFederationManager
from flwr.proto.fleet_pb2_grpc import add_FleetServicer_to_server
from flwr.common.grpc import generic_create_grpc_server
from flwr.common import GRPC_MAX_MESSAGE_LENGTH
from flwr.common.constant import (
    ISOLATION_MODE_SUBPROCESS,
    SERVER_OCTET,
    CLIENT_OCTET,
    ExecPluginType,
)

# Control API imports
from flwr.superlink. servicer. control import run_control_api_grpc
from flwr.superlink.auth_plugin import (
    NoOpControlAuthnPlugin,
    NoOpControlAuthzPlugin,
)

# ServerAppIo API imports  
from flwr.server.superlink.serverappio. serverappio_grpc import run_serverappio_api_grpc

from custom_fleet.custom_fleet_servicer import CustomFleetServicer


def start_custom_superlink(
    fleet_api_address: str,
    control_api_address: str,
    serverappio_api_address: str,
    database_path: str,
    ssl_certfile: Optional[str],
    ssl_keyfile: Optional[str],
    ssl_ca_certfile: Optional[str],
    enable_supernode_auth: bool = False,
    isolation: str = ISOLATION_MODE_SUBPROCESS,
) -> tuple[grpc.Server, grpc.Server, grpc.Server]:
    """Start custom SuperLink with external access control."""
    log(INFO, "=" * 80)
    log(INFO, "Starting Custom Flower SuperLink with External Access Control")
    log(INFO, "=" * 80)
    
    # Note: Access control is handled by the CustomFleetServicer's PolicyEnforcementPoint
    log(INFO, "Custom SuperLink with Policy Enforcement Point integration")
    

    federation_manager = NoOpFederationManager()
    objectstore_factory = ObjectStoreFactory(database_path)
    state_factory = LinkStateFactory(
        database_path,
        federation_manager,
        objectstore_factory
    )
    ffs_factory = FfsFactory("./.flwr/ffs")
    
    # Setup SSL Certificates
    certificates = None
    if ssl_certfile and ssl_keyfile and ssl_ca_certfile:
        log(INFO, "SSL enabled for Fleet and Control APIs")
        certificates = (
            Path(ssl_ca_certfile).read_bytes(),
            Path(ssl_certfile).read_bytes(),
            Path(ssl_keyfile).read_bytes(),
        )
    else:
        log(INFO, "SSL disabled (running in INSECURE mode)")
    
    # Create Custom Fleet Servicer
    fleet_servicer = CustomFleetServicer(
        state_factory=state_factory,
        ffs_factory=ffs_factory,
        objectstore_factory=objectstore_factory,
        enable_supernode_auth=enable_supernode_auth,
    )
    
    # Create and Start Fleet API
    fleet_grpc_server = generic_create_grpc_server(
        servicer_and_add_fn=(fleet_servicer, add_FleetServicer_to_server),
        server_address=fleet_api_address,
        max_message_length=GRPC_MAX_MESSAGE_LENGTH,
        certificates=certificates,
    )
    fleet_grpc_server.start()
    
    log(INFO, "=" * 80)
    log(INFO, "Custom SuperLink Fleet API started on %s", fleet_api_address)
    log(INFO, "Access Control: Policy Enforcement Point (PEP) enabled")
    log(INFO, "=" * 80)
    
    # Start ServerAppIo API
    log(INFO, "Starting ServerAppIo API on %s (insecure, localhost-only)", serverappio_api_address)
    serverappio_grpc_server = run_serverappio_api_grpc(
        address=serverappio_api_address,
        state_factory=state_factory,
        ffs_factory=ffs_factory,
        objectstore_factory=objectstore_factory,
        certificates=None,
    )
    log(INFO, "ServerAppIo API started")
    
    # Start Control API
    log(INFO, "Starting Control API on %s", control_api_address)
    
    authn_plugin = NoOpControlAuthnPlugin(
        account_auth_config_path=None,
        verify_tls_cert=True,
    )
    authz_plugin = NoOpControlAuthzPlugin(
        account_auth_config_path=None,
        verify_tls_cert=True,
    )
    
    control_grpc_server = run_control_api_grpc(
        address=control_api_address,
        state_factory=state_factory,
        ffs_factory=ffs_factory,
        objectstore_factory=objectstore_factory,
        certificates=certificates,
        authn_plugin=authn_plugin,
        authz_plugin=authz_plugin,
        is_simulation=False,
    )
    
    log(INFO, "Control API started")
    
    # ===== START SUPEREXEC FOR SERVERAPP =====
    if isolation == ISOLATION_MODE_SUBPROCESS:
        log(INFO, "Starting SuperExec for ServerApp management")
        
        _octet, _colon, _port = serverappio_api_address.rpartition(":")
        io_address = (
            f"{CLIENT_OCTET}:{_port}" 
            if _octet == SERVER_OCTET 
            else serverappio_api_address
        )
        
        command = ["flower-superexec"]
        command += ["--insecure"]
        command += ["--appio-api-address", io_address]
        command += ["--plugin-type", ExecPluginType.SERVER_APP]
        command += ["--parent-pid", str(os.getpid())]
        
        log(INFO, "SuperExec command: %s", " ".join(command))
        
        try:
            subprocess. Popen(command)
            log(INFO, "✅ SuperExec started in subprocess mode")
        except Exception as e:
            log(ERROR, "❌ Failed to start SuperExec: %s", e)
            raise
    
    log(INFO, "=" * 80)
    log(INFO, "All components running.  SuperLink ready.")
    log(INFO, "=" * 80)
    
    return fleet_grpc_server, control_grpc_server, serverappio_grpc_server



def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Custom Flower SuperLink with External Access Control and Aggregation Filtering"
    )
    
    parser.add_argument(
        "--fleet-api-address",
        type=str,
        default="0.0.0.0:9092",
        help="Fleet API address (default: 0.0.0.0:9092)",
    )
    
    parser.add_argument(
        "--control-api-address",
        type=str,
        default="0.0.0.0:9093",
        help="Control API address (default: 0.0.0.0:9093)",
    )
    
    parser.add_argument(
        "--serverappio-api-address",
        type=str,
        default="0.0.0.0:9091",
        help="ServerAppIo API address (default: 0.0.0.0:9091)",
    )
    
    parser.add_argument(
        "--database",
        type=str,
        default="superlink.db",
        help="Path to SQLite database (default: superlink. db)",
    )
    
    parser.add_argument(
        "--isolation",
        type=str,
        default=ISOLATION_MODE_SUBPROCESS,
        choices=[ISOLATION_MODE_SUBPROCESS, "process"],
        help="Isolation mode for ServerApp (default: subprocess)",
    )
    
    parser.add_argument("--ssl-certfile", type=str, help="Path to SSL certificate file")
    parser.add_argument("--ssl-keyfile", type=str, help="Path to SSL private key file")
    parser.add_argument("--ssl-ca-certfile", type=str, help="Path to SSL CA certificate file")
    
    parser.add_argument(
        "--enable-supernode-auth",
        action="store_true",
        help="Enable SuperNode authentication",
    )
    
    args = parser.parse_args()
    
    fleet_server, control_server, serverappio_server = start_custom_superlink(
        fleet_api_address=args.fleet_api_address,
        control_api_address=args.control_api_address,
        serverappio_api_address=args.serverappio_api_address,
        database_path=args.database,
        ssl_certfile=args.ssl_certfile,
        ssl_keyfile=args.ssl_keyfile,
        ssl_ca_certfile=args.ssl_ca_certfile,
        enable_supernode_auth=args.enable_supernode_auth,
        isolation=args.isolation,
    )
    
    try:
        fleet_server.wait_for_termination()
    except KeyboardInterrupt:
        log(INFO, "\n" + "=" * 80)
        log(INFO, "Shutting down Custom SuperLink...")
        log(INFO, "=" * 80)
        fleet_server.stop(grace=5)
        control_server.stop(grace=5)
        serverappio_server.stop(grace=5)
        log(INFO, "✅ Shutdown complete")
        sys.exit(0)


if __name__ == "__main__":  
    main()