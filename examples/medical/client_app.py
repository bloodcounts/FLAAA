"""Flower client app for centre-partitioned binary classification."""

import os
import torch
import logging
import hashlib
import time
from flwr.app import Array, ArrayRecord, Context, Message, MetricRecord, RecordDict
from flwr.clientapp import ClientApp

from medical.task import (
    DenseClassifier,
    load_interval_centre,
    get_interval_metadata,
    parse_hidden_dims,
    get_model_params,
    set_model_params,
    train_model,
    evaluate_model,
    last_linear_parameter_names,
    build_icnn_modules,
    train_model_fedmap,
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


def _message_config(msg: Message, context: Context):
    """Use the round configuration when present, with run config as fallback."""
    return msg.content.get("config", context.run_config)


def _inject_experiment_fault(msg: Message, context: Context, stage: str, partition_id: int) -> None:
    """Deterministic, opt-in fault injection for resilience experiments."""
    config = _message_config(msg, context)
    profile = str(config.get("fault_profile", "nominal")).lower()
    if profile == "nominal":
        return
    seed = int(config.get("fault_seed", 0))
    group = getattr(msg.metadata, "group_id", "0")
    # A dropout profile selects a stable client subset across all rounds;
    # changing availability deliberately re-samples the subset by round.
    availability_epoch = "fixed" if profile == "dropout" else group
    token = f"{seed}:{partition_id}:{availability_epoch}:{stage}".encode()
    score = int(hashlib.sha256(token).hexdigest()[:8], 16) / 0xFFFFFFFF
    if profile in {"latency", "dropout", "straggler", "changing"}:
        time.sleep(float(config.get("fault_base_delay_s", 0.10)))
    if profile == "dropout" and stage == "train" and score < float(config.get("fault_fraction", 0.20)):
        raise RuntimeError("Injected deterministic client dropout")
    if profile == "straggler" and score < float(config.get("fault_fraction", 0.20)):
        time.sleep(float(config.get("fault_straggler_delay_s", 1.0)))
    if profile == "changing" and stage == "train" and score < float(config.get("fault_fraction", 0.20)):
        raise RuntimeError("Injected availability change after scheduling")


def _restore_fedper_head(model, context: Context, enabled: bool):
    if not enabled:
        return []
    names = last_linear_parameter_names(model)
    saved = context.state.get("fedper_head")
    if isinstance(saved, ArrayRecord):
        state = model.state_dict()
        for name, value in saved.to_torch_state_dict().items():
            if name in names:
                state[name].copy_(value.to(state[name].device))
    return names


def _save_fedper_head(model, context: Context, names):
    if names:
        state = model.state_dict()
        context.state["fedper_head"] = ArrayRecord({
            name: Array(state[name].detach().cpu().numpy()) for name in names
        })


@app.train()
def train(msg: Message, context: Context):
    """Train the model using the new Flower ClientApp API."""

    # ------------------------------------------------------------------- #
    # 1. Get federation-specific configuration
    # ------------------------------------------------------------------- #
    train_config = _message_config(msg, context)
    federation = train_config.get("federation", context.run_config.get("federation", "default"))
    local_epochs = train_config.get("local_epochs", 1)
    learning_rate = train_config.get("learning_rate", 0.001)
    batch_size = train_config.get("batch_size", 64)
    hidden_dims = parse_hidden_dims(train_config.get("hidden_dims", [64, 64]))
    dropout = train_config.get("dropout", 0.3)
    proximal_mu = float(train_config.get("proximal_mu", 0.0))
    fedper = bool(train_config.get("fedper_personalize_last_layer", False))

    # ------------------------------------------------------------------- #
    # 2. Determine client/partition ID -> INTERVAL donation-centre number
    # ------------------------------------------------------------------- #
    raw_partition_id = context.node_config.get("partition-id", 0)
    try:
        partition_id = int(raw_partition_id)
    except (TypeError, ValueError):
        partition_id = 0
    centre_id = partition_id + 1  # INTERVAL centres are numbered 1..25
    _inject_experiment_fault(msg, context, "train", partition_id)

    logging.info(
        f"[{federation}] Client partition {partition_id} (INTERVAL centre {centre_id}) - "
        f"Starting training with lr={learning_rate}, epochs={local_epochs}, batch_size={batch_size}"
    )

    print(f"\n{'='*70}")
    print(f"🔵 TRAINING - Federation: {federation}")
    print(f"   Client:  partition {partition_id} (INTERVAL centre {centre_id})")
    print(f"   Config: epochs={local_epochs}, lr={learning_rate}, batch={batch_size}")
    print(f"   Model: hidden_dims={hidden_dims}, dropout={dropout}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 3. Load data for this INTERVAL centre
    # ------------------------------------------------------------------- #
    train_loader, val_loader, test_loader, num_samples = load_interval_centre(
        centre_id=centre_id,
        batch_size=batch_size,
    )

    # ------------------------------------------------------------------- #
    # 4. Initialize model with federation-specific architecture
    # ------------------------------------------------------------------- #
    model = DenseClassifier(
        input_dim=get_interval_metadata()["n_features"],
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
    global_reference = {name: value.detach().clone() for name, value in model.named_parameters()}
    personal_names = _restore_fedper_head(model, context, fedper)

    # ------------------------------------------------------------------- #
    # 5. Train the model with federation-specific settings
    # ------------------------------------------------------------------- #
    is_fedmap = "icnn" in msg.content
    contribution = None
    if is_fedmap:
        # FedMAP: local training uses the ICNN-prior-augmented loss against a
        # frozen copy of the just-received global model (gamma), matching
        # the local maximum-a-posteriori training objective.
        gamma_net = DenseClassifier(
            input_dim=get_interval_metadata()["n_features"],
            output_dim=2, hidden_dims=hidden_dims, dropout=dropout,
        ).to(device)
        gamma_net.load_state_dict(state_dict)
        gamma_net.eval()
        for p in gamma_net.parameters():
            p.requires_grad_(False)

        icnn_alpha = float(train_config.get("icnn_alpha", 0.1))
        cnnet_modules = build_icnn_modules(model, hidden_dims=(64, 32), alpha=icnn_alpha).to(device)
        cnnet_modules.load_state_dict(msg.content["icnn"].to_torch_state_dict())

        best_state_dict, contribution, train_loss, val_loss = train_model_fedmap(
            net=model, gamma_net=gamma_net, cnnet_modules=cnnet_modules,
            trainloader=train_loader, valloader=val_loader, device=device,
            local_epochs=local_epochs, learning_rate=learning_rate,
        )
    else:
        best_state_dict, train_loss, val_loss = train_model(
            net=model,
            trainloader=train_loader,
            valloader=val_loader,
            device=device,
            local_epochs=local_epochs,  # Federation-specific epochs
            learning_rate=learning_rate,  # Federation-specific LR
            proximal_reference=global_reference if proximal_mu else None,
            proximal_mu=proximal_mu,
        )

    # Load best weights back (in case early stopping was used)
    model.load_state_dict(best_state_dict)

    # ------------------------------------------------------------------- #
    # 6. Prepare reply: model parameters + metrics
    # ------------------------------------------------------------------- #
       # ------------------------------------------------------------------- #
    # 6. Prepare reply: model parameters + metrics
    # ------------------------------------------------------------------- #
    if is_fedmap:
        context.state["fedmap_model"] = ArrayRecord.from_torch_state_dict(model.state_dict())
    _save_fedper_head(model, context, personal_names)
    reply_state = model.state_dict()
    for name in personal_names:
        reply_state[name] = state_dict[name]
    model_record = ArrayRecord.from_torch_state_dict(reply_state)
    metrics = {
        "train_loss": float(train_loss),
        "val_loss": float(val_loss),
        "num-examples": int(len(train_loader.dataset)),
        "partition_id": int(partition_id),
        "centre_id": int(centre_id),
    }
    if is_fedmap:
        metrics["omega"] = float(contribution)
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
    evaluation_config = _message_config(msg, context)
    federation = evaluation_config.get("federation", context.run_config.get("federation", "default"))
    batch_size = evaluation_config.get("batch_size", 64)
    hidden_dims = parse_hidden_dims(evaluation_config.get("hidden_dims", [64, 64]))
    dropout = evaluation_config.get("dropout", 0.3)

    # ------------------------------------------------------------------- #
    # 2. Determine client/partition ID -> INTERVAL donation-centre number
    # ------------------------------------------------------------------- #
    raw_partition_id = context.node_config.get("partition-id", 0)
    try:
        partition_id = int(raw_partition_id)
    except (TypeError, ValueError):
        partition_id = 0
    centre_id = partition_id + 1
    _inject_experiment_fault(msg, context, "evaluate", partition_id)

    logging.info(
        f"[{federation}] Client partition {partition_id} (INTERVAL centre {centre_id}) - "
        f"Starting evaluation"
    )

    print(f"\n{'='*70}")
    print(f"🟢 EVALUATION - Federation: {federation}")
    print(f"   Client: partition {partition_id} (INTERVAL centre {centre_id})")
    print(f"   Batch Size: {batch_size}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 3. Load test data (this centre's held-out INTERVAL validation split)
    # ------------------------------------------------------------------- #
    _, _, test_loader, _ = load_interval_centre(
        centre_id=centre_id,
        batch_size=batch_size,
    )

    # ------------------------------------------------------------------- #
    # 4. Initialize model with federation-specific architecture
    # ------------------------------------------------------------------- #
    model = DenseClassifier(
        input_dim=get_interval_metadata()["n_features"],
        output_dim=2,
        hidden_dims=hidden_dims,  # Federation-specific architecture
        dropout=dropout  # Federation-specific dropout
    )
    device = torch. device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    server_arrays = msg.content["arrays"]
    state_dict = server_arrays.to_torch_state_dict()
    model.load_state_dict(state_dict)
    _restore_fedper_head(model, context, bool(evaluation_config.get("fedper_personalize_last_layer", False)))
    if evaluation_config.get("fedmap_personalize", False):
        local_model = context.state.get("fedmap_model")
        if isinstance(local_model, ArrayRecord):
            model.load_state_dict(local_model.to_torch_state_dict())

    # ------------------------------------------------------------------- #
    # 5. Evaluate
    # ------------------------------------------------------------------- #
    test_loss, _, metrics = evaluate_model(model, test_loader, device)
    accuracy = float(metrics["accuracy"])
    roc_auc = float(metrics["roc_auc"])

    logging.info(
        f"[{federation}] Client partition {partition_id} (centre {centre_id}) - "
        f"Test Loss: {test_loss:.4f}, Accuracy: {accuracy:.4f}, ROC-AUC: {roc_auc:.4f}"
    )

    print(f"   ✓ Test Loss: {test_loss:.4f}")
    print(f"   ✓ Accuracy: {accuracy:.4f}")
    print(f"   ✓ ROC-AUC: {roc_auc:.4f}")
    print(f"{'='*70}\n")

    # ------------------------------------------------------------------- #
    # 6. Prepare reply (only numeric metrics)
    # ------------------------------------------------------------------- #
    metrics_dict = {
        "test_loss": float(test_loss),
        "accuracy": float(accuracy),
        "roc_auc": float(roc_auc),
        "num-examples": int(len(test_loader.dataset)),
        "partition_id": int(partition_id),
        "centre_id": int(centre_id),
    }
    metric_record = MetricRecord(metrics_dict)
    content = RecordDict({"metrics": metric_record})

    return Message(content=content, reply_to=msg)
