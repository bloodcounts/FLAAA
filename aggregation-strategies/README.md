# Aggregation Strategies

Federated learning aggregation strategies with access control filtering for the FLAAA project.

## Features

This package provides two aggregation strategies that integrate with external Policy Enforcement Points (PEP) for access control:

- **FedAvgGridWithFilter**: Federated Averaging with access control filtering
- **FedMAPWithFilter**: Federated MAP with ICNN prior and access control filtering

Both strategies delegate authorization decisions to an external access control validator, allowing fine-grained control over which nodes can participate in training and evaluation.

## Installation

Install in development mode:

```bash
cd /home/fan/projects/FLAAA/aggregation-strategies
pip install -e .
```

## Usage

```python
from aggregation_strategies.strategies import FedAvgGridWithFilter, FedMAPWithFilter
from flwr_abac.access_control.validator_pep import ExternalAccessControlValidator

# Initialize access validator
access_validator = ExternalAccessControlValidator()

# Use FedAvg strategy with access control
strategy = FedAvgGridWithFilter(
    access_validator=access_validator,
    federation="medical",
)

# Or use FedMAP strategy with access control
strategy = FedMAPWithFilter(
    access_validator=access_validator,
    federation="medical",
    icnn_modules=icnn_modules,  # Optional ICNN modules for personalization
)
```

## Strategies

### FedAvgGridWithFilter

Custom Grid API FedAvg strategy that uses external PEP for access control. It filters nodes during:
- Training configuration
- Training aggregation
- Evaluation configuration

### FedMAPWithFilter

Federated MAP strategy with ICNN prior and external PEP access control. Supports:
- Personalized aggregation using Input Convex Neural Networks (ICNN)
- Weighted aggregation based on client contributions
- Access control filtering for training and evaluation

## Requirements

- Python >= 3.9
- Flower >= 1.0.0
- PyTorch >= 2.0.0
- NumPy >= 1.24.0

<!-- License information consolidated at repository root LICENSE -->
