"""Flower client app (new ClientApp API) for Adult Census Income Classification."""

import os
import torch
import logging
from flwr.app import ArrayRecord, Context, Message, MetricRecord, RecordDict
from flwr.clientapp import ClientApp

from flwr_abac.task import (
    DenseClassifier,
    load_adult_data,
    get_model_params,
    set_model_params,
    train_model,
    evaluate_model,
)

# --------------------------------------------------------------------------- #
# Logging configuration
# --------------------------------------------------------------------------- #
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(log_dir, "client_logs.txt"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# --------------------------------------------------------------------------- #
# ClientApp definition
# --------------------------------------------------------------------------- #
app = ClientApp()


@app.train()
def train(msg: Message, context: Context):
    """Train the model using the new Flower ClientApp API."""

    # ------------------------------------------------------------------- #
    # 1. Get federation-specific configuration
    # ------------------------------------------------------------------- #
    federation = context.run_config.get("federation", "default")
    local_epochs = context.run_config.get("local_epochs", 1)
    learning_rate = context.run_config.get("learning_rate", 0.001)
    batch_size = context.run_config.get("batch_size", 64)
    hidden_dims = context.run_config.get("hidden_dims", [64, 64])
    dropout = context.run_config.get("dropout", 0.3)

    # ------------------------------------------------------------------- #
    # 2. Determine client/partition ID (custom mapping)
    # ------------------------------------------------------------------- #
    raw_partition_id = context.node_config.get("partition-id", "unknown")
    if raw_partition_id == "gb_uclh": 
        partition_id = 0
    elif raw_partition_id == "gb_barts":
        partition_id = 1
    elif raw_partition_id == "gb_cuh":
        partition_id = 2
    else:
        partition_id = 1  # fallback

    logging.info(
        f"[{federation}] Client '{raw_partition_id}' (partition {partition_id}) - "
        f"Starting training with lr={learning_rate}, epochs={local_epochs}, batch_size={batch_size}"
    )
    
    print(f"\n{'='*70}")
    print(f"🔵 TRAINING - Federation: {federation}")
    print(f"   Client:  {raw_partition_id} (Partition {partition_id})")
    print(f"   Config: epochs={local_epochs}, lr={learning_rate}, batch={batch_size}")
    print(f"   Model: hidden_dims={hidden_dims}, dropout={dropout}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 3. Load data for this partition
    # ------------------------------------------------------------------- #
    train_loader, val_loader, test_loader, num_samples = load_adult_data(
        client_id=partition_id,
        batch_size=batch_size  # Use federation-specific batch size
    )

    # ------------------------------------------------------------------- #
    # 4. Initialize model with federation-specific architecture
    # ------------------------------------------------------------------- #
    model = DenseClassifier(
        input_dim=14,
        output_dim=2,
        hidden_dims=hidden_dims,  # Federation-specific architecture
        dropout=dropout  # Federation-specific dropout
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Convert incoming ArrayRecord → torch state_dict → load into model
    server_arrays = msg.content["arrays"]
    state_dict = server_arrays.to_torch_state_dict()
    model.load_state_dict(state_dict)

    # ------------------------------------------------------------------- #
    # 5. Train the model with federation-specific settings
    # ------------------------------------------------------------------- #
    best_state_dict, train_loss, val_loss = train_model(
        net=model,
        trainloader=train_loader,
        valloader=val_loader,
        device=device,
        local_epochs=local_epochs,  # Federation-specific epochs
        learning_rate=learning_rate,  # Federation-specific LR
    )

    # Load best weights back (in case early stopping was used)
    model.load_state_dict(best_state_dict)

    # ------------------------------------------------------------------- #
    # 6. Prepare reply: model parameters + metrics
    # ------------------------------------------------------------------- #
       # ------------------------------------------------------------------- #
    # 6. Prepare reply: model parameters + metrics
    # ------------------------------------------------------------------- #
    model_record = ArrayRecord.from_torch_state_dict(model.state_dict())
    metrics = {
        "train_loss": float(train_loss),
        "val_loss": float(val_loss),
        "num-examples": int(len(train_loader.dataset)),
        # ❌ REMOVE: "federation": federation,  # String - not allowed in MetricRecord
        # ❌ REMOVE: "client_id": str(raw_partition_id),  # String - not allowed in MetricRecord
    }
    metric_record = MetricRecord(metrics)

    content = RecordDict({
        "arrays": model_record,
        "metrics": metric_record,
    })

    # ✅ Log the federation/client info separately
    logging.info(
        f"[{federation}] Client '{raw_partition_id}' - Training complete: "
        f"train_loss={train_loss:.4f}, val_loss={val_loss:.4f}"
    )

    return Message(content=content, reply_to=msg)


@app.evaluate()
def evaluate(msg: Message, context: Context):
    """Evaluate the model using the new Flower ClientApp API."""

    # ------------------------------------------------------------------- #
    # 1. Get federation-specific configuration
    # ------------------------------------------------------------------- #
    federation = context.run_config.get("federation", "default")
    batch_size = context.run_config.get("batch_size", 64)
    hidden_dims = context.run_config.get("hidden_dims", [64, 64])
    dropout = context. run_config.get("dropout", 0.3)

    # ------------------------------------------------------------------- #
    # 2. Determine client/partition ID
    # ------------------------------------------------------------------- #
    raw_partition_id = context. node_config.get("partition-id", "unknown")
    
    print(f"\nRaw partition ID: {raw_partition_id}")
    if raw_partition_id == "gb_uclh":
        partition_id = 0
    elif raw_partition_id == "gb_barts":
        partition_id = 1
    elif raw_partition_id == "gb_cuh":
        partition_id = 2
    else:
        partition_id = 1

    logging.info(
        f"[{federation}] Client '{raw_partition_id}' (partition {partition_id}) - "
        f"Starting evaluation"
    )

    print(f"\n{'='*70}")
    print(f"🟢 EVALUATION - Federation: {federation}")
    print(f"   Client: {raw_partition_id} (Partition {partition_id})")
    print(f"   Batch Size: {batch_size}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 3. Load test data
    # ------------------------------------------------------------------- #
    _, _, test_loader, _ = load_adult_data(
        client_id=partition_id,
        batch_size=batch_size  # Federation-specific batch size
    )

    # ------------------------------------------------------------------- #
    # 4. Initialize model with federation-specific architecture
    # ------------------------------------------------------------------- #
    model = DenseClassifier(
        input_dim=14,
        output_dim=2,
        hidden_dims=hidden_dims,  # Federation-specific architecture
        dropout=dropout  # Federation-specific dropout
    )
    device = torch. device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    server_arrays = msg.content["arrays"]
    state_dict = server_arrays.to_torch_state_dict()
    model.load_state_dict(state_dict)

    # ------------------------------------------------------------------- #
    # 5. Evaluate
    # ------------------------------------------------------------------- #
    test_loss, _, metrics = evaluate_model(model, test_loader, device)
    accuracy = float(metrics["accuracy"])

    logging.info(
        f"[{federation}] Client '{raw_partition_id}' (partition {partition_id}) - "
        f"Test Loss: {test_loss:.4f}, Accuracy: {accuracy:.4f}"
    )

    print(f"   ✓ Test Loss: {test_loss:.4f}")
    print(f"   ✓ Accuracy: {accuracy:.4f}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 6. Prepare reply (only numeric metrics)
    # ------------------------------------------------------------------- #
    metrics_dict = {
        "test_loss": float(test_loss),
        "accuracy": float(accuracy),
        "num-examples": int(len(test_loader.dataset)),
        # ❌ REMOVE: "federation": federation,  # String - not allowed
        # ❌ REMOVE: "client_id": str(raw_partition_id),  # String - not allowed
    }
    metric_record = MetricRecord(metrics_dict)
    content = RecordDict({"metrics": metric_record})

    return Message(content=content, reply_to=msg)