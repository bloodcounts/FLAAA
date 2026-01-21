"""Aggregation Strategies for Federated Learning with Access Control.

This package provides aggregation strategies for federated learning that integrate
with external Policy Enforcement Points (PEP) for access control.

Available Strategies:
- FedAvgGridWithFilter: Federated Averaging with access control filtering
- FedMAPWithFilter: Federated MAP with ICNN prior and access control filtering
"""

from .strategies import FedAvgGridWithFilter, FedMAPWithFilter

__version__ = "0.1.0"

__all__ = [
    "FedAvgGridWithFilter",
    "FedMAPWithFilter",
]
