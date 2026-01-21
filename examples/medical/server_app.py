"""Flower server app with federation-aware configuration and access control."""

import torch
import os
from flwr.app import ArrayRecord, ConfigRecord, Context
from flwr.serverapp import Grid, ServerApp
from flwr.serverapp.strategy import FedAvg

from flwr_abac.task import DenseClassifier
from flwr_abac.access_control.validator_pep import ExternalAccessControlValidator
from flwr_abac.access_control.config import AccessControlConfig
from aggregation_strategies.strategies import FedAvgGridWithFilter


# --------------------------------------------------------------------------- #
# ServerApp definition
# --------------------------------------------------------------------------- #
app = ServerApp()


@app.main()
def main(grid: Grid, context: Context) -> None:
    """Main entry point for the ServerApp using Grid API with access control."""

    # Get federation name
    federation = context.run_config.get("federation", "default")
    
    print("=" * 80)
    print(f"FEDERATION: {federation.upper()}")
    print("=" * 80)

    # Read configuration
    num_rounds = context.run_config.get("num_rounds", 2)
    hidden_dims = context.run_config.get("hidden_dims", [64, 64])
    dropout = context.run_config.get("dropout", 0.3)
    fraction_train = context.run_config.get("fraction_train", 1.0)
    fraction_evaluate = context.run_config. get("fraction_evaluate", 1.0)
    min_available_clients = context.run_config.get("min_available_clients", 2)
    local_epochs = 1
    learning_rate = context.run_config.get("learning_rate", 0.001)
    batch_size = context. run_config. get("batch_size", 64)

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

    # ✅ Initialize access validator
    # print("🔐 Initializing Access Control...")
    # acl_config = AccessControlConfig.from_env()
    
    # # Find policies directory
    # current_dir = os.path.dirname(os.path.abspath(__file__))
    # policy_dir = os.path.join(current_dir, "policies")
    
    # if not os.path.exists(policy_dir):
    #     policy_dir = os.getenv("EXTERNAL_ACL_POLICY_DIR", "policies")
    
    # print(f"   └── Policy Directory: {policy_dir}")
    
    access_validator = ExternalAccessControlValidator()


    # Create global model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    global_model = DenseClassifier(
        input_dim=14,
        output_dim=2,
        hidden_dims=hidden_dims,
        dropout=dropout
    ).to(device)

    # Convert to ArrayRecord
    initial_arrays = ArrayRecord. from_torch_state_dict(global_model. state_dict())

    # ✅ Use custom Grid API FedAvg with access control filtering
    strategy = FedAvgGridWithFilter(
        access_validator=access_validator,
        federation=federation,
    )

    # Training configuration
    train_config = ConfigRecord({
        "local_epochs":  local_epochs,
        "learning_rate": learning_rate,
        "batch_size": batch_size,
        "federation": federation,
    })

    # Evaluation configuration
    evaluate_config = ConfigRecord({
        "batch_size": batch_size,
        "federation": federation,
    })

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
        model_filename = f"final_model_{federation}. pt"
        torch.save(final_state_dict, model_filename)
        
        print(f"✓ Final model saved as '{model_filename}'")
        
    except Exception as e:  
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 80)