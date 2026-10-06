"""Launch Flower 1.36 with a study-approval PEP in the gRPC Fleet service."""
import importlib
import sys

from custom_fleet.custom_fleet_servicer import CustomFleetServicer


def main():
    """Use Flower's startup lifecycle with the governed Fleet implementation."""
    args = sys.argv[1:]
    # The enforcement hook is implemented for the gRPC request-response API.
    for index, arg in enumerate(args):
        value = args[index + 1] if arg == "--fleet-api-type" and index + 1 < len(args) else None
        if arg.startswith("--fleet-api-type="):
            value = arg.split("=", 1)[1]
        if value is not None and value != "grpc-rere":
            raise SystemExit("The governed coordinator requires --fleet-api-type grpc-rere")
    implementation = importlib.import_module("flwr.superlink.cli.flower_superlink")
    implementation.FleetServicer = CustomFleetServicer
    implementation.flower_superlink()


if __name__ == "__main__":
    main()
