"""Flower server app with federation-aware configuration and access control."""

import json
import torch
import os
from flwr.app import ArrayRecord, ConfigRecord, Context
from flwr.serverapp import Grid, ServerApp
from flwr.serverapp.strategy import FedAvg

from medical.task import DenseClassifier, get_interval_metadata, parse_hidden_dims, build_icnn_modules
from medical.access_control.validator_pep import ExternalAccessControlValidator
from medical.access_control.noop_validator import NoOpAccessValidator
from medical.access_control.config import AccessControlConfig
from medical.access_control.fedavg_grid_with_filter import FedAvgGridWithFilter
from medical.access_control.fedprox_grid_with_filter import FedProxGridWithFilter
from medical.access_control.fedper_grid_with_filter import FedPerGridWithFilter
from medical.access_control.fedmap_grid_with_filter import FedMAPWithFilter


# --------------------------------------------------------------------------- #
# ServerApp definition
# --------------------------------------------------------------------------- #
app = ServerApp()


def _register_pip_members(node_ids, task_id: str, expires: str = "2027-12-31T23:59:59Z"):
    """Write every given node id into the PDP's PIP data file as a valid,
    non-expired, participant-role member of `task_id`.

    The PDP (PolicyInformationPoint.readData()) re-reads this file from disk
    on every decision request, so no PDP restart is required; the file path
    is the same PIP_DATA_PATH the PDP process was started with.
    """
    pip_path = os.getenv("PIP_DATA_PATH")
    if not pip_path:
        raise RuntimeError("PIP_DATA_PATH must be set to register simulated nodes for governance")

    if os.path.exists(pip_path):
        with open(pip_path) as fh:
            data = json.load(fh)
    else:
        data = {"tasks": {}}

    task = data.setdefault("tasks", {}).setdefault(task_id, {
        "task_expires": expires,
        "task_membership_expires": expires,
        "nodes": {},
    })
    for node_id in node_ids:
        task["nodes"][str(node_id)] = {
            "is_member_of_task": True,
            "task_membership_expires": expires,
            "task_role": "participant",
        }

    with open(pip_path, "w") as fh:
        json.dump(data, fh, indent=2)


@app.main()
def main(grid: Grid, context: Context) -> None:
    """Main entry point for the ServerApp using Grid API with access control."""

    # Get federation name
    federation = context.run_config.get("federation", "default")
    strategy_name = str(context.run_config.get("strategy", "fedavg")).lower()
    
    print("=" * 80)
    print(f"FEDERATION: {federation.upper()}")
    print("=" * 80)

    # Read configuration
    num_rounds = context.run_config.get("num_rounds", 2)
    hidden_dims = parse_hidden_dims(context.run_config.get("hidden_dims", [64, 64]))
    dropout = context.run_config.get("dropout", 0.3)
    fraction_train = context.run_config.get("fraction_train", 1.0)
    fraction_evaluate = context.run_config. get("fraction_evaluate", 1.0)
    min_available_clients = context.run_config.get("min_available_clients", 2)
    local_epochs = int(context.run_config.get("local_epochs", 1))
    learning_rate = context.run_config.get("learning_rate", 0.001)
    batch_size = context. run_config. get("batch_size", 64)
    governance_enabled = str(context.run_config.get("governance_enabled", "true")).lower() == "true"

    # Display configuration
    print(f"\n📋 Training Configuration for '{federation}':")
    print(f"   ├── Rounds: {num_rounds}")
    print(f"   ├── Local Epochs: {local_epochs}")
    print(f"   ├── Model:  hidden_dims={hidden_dims}, dropout={dropout}")
    print(f"   ├── Learning Rate:  {learning_rate}")
    print(f"   ├── Batch Size: {batch_size}")
    print(f"   ├── Fraction Train: {fraction_train}")
    print(f"   ├── Fraction Evaluate: {fraction_evaluate}")
    print(f"   └── Min Available Clients: {min_available_clients}")
    print()

    # The ungoverned option is for controlled comparison runs.
    if governance_enabled:
        print("🔐 Initializing access control (fail closed, real PDP)...")
        acl_config = AccessControlConfig.from_env()
        access_validator = ExternalAccessControlValidator(
            timeout_seconds=acl_config.timeout_seconds,
            retry_count=acl_config.retry_count,
            fail_open=acl_config.fail_open,
        )
    else:
        print("Governance disabled for this comparison run.")
        access_validator = NoOpAccessValidator()

    # Create global model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    input_dim = get_interval_metadata()["n_features"]
    global_model = DenseClassifier(
        input_dim=input_dim,
        output_dim=2,
        hidden_dims=hidden_dims,
        dropout=dropout
    ).to(device)

    # Convert to ArrayRecord
    initial_arrays = ArrayRecord. from_torch_state_dict(global_model. state_dict())

    strategy_options = {
        "fraction_train": float(fraction_train),
        "fraction_evaluate": float(fraction_evaluate),
        "min_available_nodes": int(min_available_clients),
    }
    if strategy_name == "fedavg":
        strategy = FedAvgGridWithFilter(access_validator=access_validator, federation=federation, **strategy_options)
    elif strategy_name == "fedprox":
        strategy = FedProxGridWithFilter(
            access_validator=access_validator, federation=federation,
            proximal_mu=float(context.run_config.get("proximal_mu", 0.01)), **strategy_options,
        )
    elif strategy_name == "fedper":
        strategy = FedPerGridWithFilter(access_validator=access_validator, federation=federation, **strategy_options)
    elif strategy_name == "fedmap":
        icnn_alpha = float(context.run_config.get("icnn_alpha", 0.1))
        icnn_modules = build_icnn_modules(global_model, hidden_dims=(64, 32), alpha=icnn_alpha)
        strategy = FedMAPWithFilter(
            access_validator=access_validator, federation=federation,
            icnn_modules=icnn_modules,
            icnn_lr=float(context.run_config.get("icnn_lr", 1e-3)),
            icnn_steps=int(context.run_config.get("icnn_steps", 2)), **strategy_options,
        )
    else:
        raise ValueError("strategy must be one of fedavg, fedprox, fedper, or fedmap")

    # Training configuration
    train_config = ConfigRecord({
        "local_epochs":  local_epochs,
        "learning_rate": learning_rate,
        "batch_size": batch_size,
        "federation": federation,
        "hidden_dims": ",".join(str(d) for d in hidden_dims),
        "dropout": dropout,
        "icnn_alpha": float(context.run_config.get("icnn_alpha", 0.1)),
        "fault_profile": str(context.run_config.get("fault_profile", "nominal")),
        "fault_seed": int(context.run_config.get("fault_seed", 0)),
        "fault_fraction": float(context.run_config.get("fault_fraction", 0.2)),
        "fault_base_delay_s": float(context.run_config.get("fault_base_delay_s", 0.1)),
        "fault_straggler_delay_s": float(context.run_config.get("fault_straggler_delay_s", 1.0)),
    })

    # Evaluation configuration
    evaluate_config = ConfigRecord({
        "batch_size": batch_size,
        "federation": federation,
        "hidden_dims": ",".join(str(d) for d in hidden_dims),
        "dropout": dropout,
        "strategy": strategy_name,
        "fault_profile": str(context.run_config.get("fault_profile", "nominal")),
        "fault_seed": int(context.run_config.get("fault_seed", 0)),
        "fault_fraction": float(context.run_config.get("fault_fraction", 0.2)),
        "fault_base_delay_s": float(context.run_config.get("fault_base_delay_s", 0.1)),
        "fault_straggler_delay_s": float(context.run_config.get("fault_straggler_delay_s", 1.0)),
    })

    # Study approval and node activation precede strategy execution.
    if governance_enabled:
        node_ids = list(grid.get_node_ids())
        register_simulated_nodes = str(context.run_config.get("register_simulated_nodes", "false")).lower() == "true"
        if register_simulated_nodes:
            _register_pip_members(node_ids, task_id=os.environ["EXTERNAL_ACL_TASK_ID"])
            print(f"Registered {len(node_ids)} simulated node ids in the local test PIP.")
        task_allowed, task_reason = access_validator.is_task_authorized()
        if not task_allowed:
            raise RuntimeError(f"Study join denied by PDP: {task_reason}")
        activation_denials = []
        for node_id in node_ids:
            allowed, reason = access_validator.is_node_activation_allowed(node_id)
            if not allowed:
                activation_denials.append((node_id, reason))
        if activation_denials:
            raise RuntimeError(f"Node activation denied for {activation_denials}")
        print(f"🔐 Study join and {len(node_ids)} node activations permitted by PDP.")

    # Start federated training
    print(f"🔄 Starting federated training for '{federation}'.. .\n")

    try:
        result = strategy.start(
            grid=grid,
            initial_arrays=initial_arrays,
            train_config=train_config,
            evaluate_config=evaluate_config,
            num_rounds=num_rounds,
        )
        
        # Save final model
        print(f"\n✅ Training completed for '{federation}'!")
        print(f"💾 Saving final global model...")
        
        final_state_dict = result.arrays. to_torch_state_dict()
        model_filename = f"final_model_{federation}.pt"
        torch.save(final_state_dict, model_filename)
        
        print(f"✓ Final model saved as '{model_filename}'")
        
    except Exception as e:  
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    
    print("=" * 80)
