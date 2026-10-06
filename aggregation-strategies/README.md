# Governance-filtered aggregation strategies

This package provides four strategies for Flower's message-based Grid API. A supplied validator checks whether each sampled node may train or evaluate and rechecks training replies before aggregation. Validator failures deny participation.

| Class | Behaviour |
| --- | --- |
| `FedAvgGridWithFilter` | Sample-count-weighted averaging |
| `FedProxGridWithFilter` | FedAvg plus `proximal_mu` in train messages; clients apply the proximal loss |
| `FedPerGridWithFilter` | FedAvg plus a personal-head flag; clients retain their last layer locally |
| `FedMAPWithFilter` | ICNN prior updates and contribution-weighted model averaging |

## Install

From the repository root:

```bash
pip install -e ./aggregation-strategies
```

Python 3.11 or later, Flower 1.36.0, PyTorch and NumPy are required. Strategy sampling follows the [Flower FedAvg API](https://flower.ai/docs/framework/1.36/en/ref-api/flwr.serverapp.strategy.FedAvg.html).

## Use

```python
from aggregation_strategies import FedProxGridWithFilter

strategy = FedProxGridWithFilter(
    access_validator=validator,
    federation="medical",
    proximal_mu=0.01,
    fraction_train=1.0,
    min_available_nodes=2,
)
```

The validator must provide `is_allowed_full_training(node_id, action="train")` and `is_allowed_to_evaluate(node_id)`, each returning `(allowed, reason)`. Training-reply checks pass `action="aggregate"`. The [medical application](../examples/README.md) provides compatible clients, a HTTPS PEP validator and ICNN construction. FedProx and FedPer require clients that honour their train-message flags. FedMAP clients return the `omega` contribution metric and accept the `icnn` record.

Study approval and node activation checks belong to the application or coordinator before the strategy starts. The strategy does not provision memberships or grant study approval.
