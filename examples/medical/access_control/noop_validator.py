"""Baseline (ungoverned) validator used only for the B0 comparison arm.

This validator makes NO network call to the PDP and always permits. It exists
solely so the matched governance ablation (B0: no governance vs. G1: fail-closed
PDP + mandatory ES256 signed audit) can hold every other part of the training
pipeline (strategy, model, data, seeds) fixed while varying only whether the
governance layer is queried at all. It must never be used outside a controlled
ablation experiment and must never be the default.
"""

from typing import Tuple, Optional


class NoOpAccessValidator:
    """Always-permit validator: no PDP call, no audit event (matches B0)."""

    def __init__(self):
        self.enabled = False

    def is_allowed_full_training(self, node_id: Optional[int] = None, action: str = "train") -> Tuple[bool, str]:
        return True, "B0 baseline: governance disabled, no PDP call"

    def is_task_authorized(self) -> Tuple[bool, str]:
        return True, "B0 baseline: governance disabled, no PDP call"

    def is_node_activation_allowed(self, node_id: Optional[int] = None) -> Tuple[bool, str]:
        return True, "B0 baseline: governance disabled, no PDP call"

    def is_allowed_to_evaluate(self, node_id: Optional[int] = None) -> Tuple[bool, str]:
        return True, "B0 baseline: governance disabled, no PDP call"
