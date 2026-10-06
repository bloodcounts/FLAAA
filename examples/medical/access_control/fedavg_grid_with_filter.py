"""Custom Grid API FedAvg strategy that uses external PEP for access control."""

from flwr.serverapp.strategy import FedAvg
from flwr.common import ArrayRecord, Message, MetricRecord
from flwr.server import Grid
from typing import Iterable, Optional
from flwr.common.logger import log
from logging import INFO, WARNING
import json
import os
import time


def _log_reply_metrics(server_round: int, replies) -> None:
    """Append each reply's own metrics (incl. per-centre roc_auc) to a JSONL
    file for offline analysis, when METRICS_LOG_PATH is set. This is an
    experiment-instrumentation hook only; it is a no-op (and touches no
    governance/aggregation behaviour) unless the env var is set."""
    path = os.getenv("METRICS_LOG_PATH")
    if not path:
        return
    with open(path, "a") as fh:
        for message in replies:
            if message.has_error():
                continue
            metrics = message.content.get("metrics")
            if metrics is None:
                continue
            record = dict(metrics)
            record["server_round"] = server_round
            record["node_id"] = message.metadata.src_node_id
            record["logged_at"] = time.time()
            fh.write(json.dumps(record) + "\n")


class FedAvgGridWithFilter(FedAvg):
    """FedAvg strategy that delegates authorization to the ExternalAccessControlValidator.

    This implementation removes hardcoded exclusion lists and any local
    `policy_engine` usage; it relies exclusively on the provided
    `access_validator` (a PEP-backed validator) to decide node participation.
    """

    def __init__(self, access_validator, federation: str, **kwargs):
        super().__init__(**kwargs)
        self.access_validator = access_validator
        self.federation = federation
        # Track nodes that are allowed to evaluate but not to train
        self.evaluation_only_nodes = set()
        log(INFO, "FedAvgGridWithFilter initialized for federation '%s'", federation)

    def configure_train(
        self,
        server_round: int,
        arrays: ArrayRecord,
        config,
        grid: Grid,
    ) -> Iterable[Message]:
        """Configure training tasks — exclude nodes denied by the PEP."""
        log(INFO, "=" * 60)
        log(INFO, "[Round %d] Configuring Training Tasks", server_round)
        log(INFO, "=" * 60)

        messages = super().configure_train(server_round, arrays, config, grid)
        messages_list = list(messages)
        if not messages_list:
            return []

        eligible_messages = []
        excluded_nodes_info = []

        for message in messages_list:
            node_id = message.metadata.dst_node_id

            # Authorize via PEP/validator for full-training participation
            allowed_train, train_reason = self._check_full_training_allowed(node_id)
            if allowed_train:
                eligible_messages.append(message)
                log(INFO, "  ✅ Node %d: Will receive training task", node_id)
                continue

            # If not allowed for training, check if allowed to only evaluate
            allowed_eval, eval_reason = self._check_evaluation_allowed(node_id)
            if allowed_eval:
                # Node is allowed to evaluate but not train — mark and exclude from training
                self.evaluation_only_nodes.add(node_id)
                excluded_nodes_info.append((node_id, f"evaluation-only: {eval_reason}"))
                log(WARNING, "  ℹ️ Node %d: evaluation-only (no training) - %s", node_id, eval_reason)
                continue

            # Not allowed to train or evaluate: remove from task
            excluded_nodes_info.append((node_id, train_reason))
            log(WARNING, "  🚫 Node %d: EXCLUDED from FL - %s", node_id, train_reason)
            continue

        log(INFO, "-" * 60)
        log(INFO, "Task Distribution Summary:")
        log(INFO, "  ├── Total sampled: %d", len(messages_list))
        log(INFO, "  ├── Will receive training tasks: %d", len(eligible_messages))
        log(INFO, "  └── Excluded from training: %d", len(excluded_nodes_info))

        if excluded_nodes_info:
            log(INFO, "  Exclusion reasons:")
            for nid, r in excluded_nodes_info:
                log(INFO, "    - Node %d: %s", nid, r)

        log(INFO, "=" * 60)
        return eligible_messages

    def aggregate_train(
        self,
        server_round: int,
        replies: Iterable[Message],
    ) -> tuple[Optional[ArrayRecord], Optional[MetricRecord]]:
        """Filter replies each round using PEP; only include allowed nodes in aggregation."""
        log(INFO, "=" * 60)
        log(INFO, "[Round %d] Training Aggregation", server_round)
        log(INFO, "=" * 60)

        replies_list = list(replies)
        eligible_replies = []
        excluded_replies = []

        for message in replies_list:
            if message.has_error():
                log(WARNING, "  ❌ Node %d: Message has error - %s", message.metadata.src_node_id, message.error.reason)
                continue

            node_id = message.metadata.src_node_id
            allowed, reason = self._check_full_training_allowed(node_id, action="aggregate")
            if allowed:
                eligible_replies.append(message)
                log(INFO, "  ✅ Node %d: INCLUDED in aggregation", node_id)
            else:
                excluded_replies.append(message)
                log(WARNING, "  ⚠️  Node %d: EXCLUDED from aggregation (%s)", node_id, reason)

        log(INFO, "-" * 60)
        log(INFO, "Aggregation Summary:")
        log(INFO, "  ├── Total replies: %d", len(replies_list))
        log(INFO, "  ├── Included in aggregation: %d", len(eligible_replies))
        log(INFO, "  └── Excluded (trained locally only): %d", len(excluded_replies))
        log(INFO, "=" * 60)

        if len(eligible_replies) == 0:
            log(WARNING, "❌ No eligible results for aggregation!")
            return None, None

        arrays, metrics = super().aggregate_train(server_round, eligible_replies)
        log(INFO, "✅ Aggregation completed successfully\n")
        return arrays, metrics

    def configure_evaluate(
        self,
        server_round: int,
        arrays: ArrayRecord,
        config,
        grid: Grid,
    ) -> Iterable[Message]:
        """Configure evaluation tasks — exclude nodes denied by the PEP."""
        log(INFO, "\n📊 [Round %d] Configuring Evaluation Tasks", server_round)
        messages = super().configure_evaluate(server_round, arrays, config, grid)
        messages_list = list(messages)

        eligible_messages = []
        excluded_count = 0
        for message in messages_list:
            node_id = message.metadata.dst_node_id
            allowed, reason = self._check_evaluation_allowed(node_id)
            if not allowed:
                excluded_count += 1
                log(WARNING, "  🚫 Node %d: EXCLUDED by PEP for evaluation - %s", node_id, reason)
                continue
            # If this node was previously marked evaluation-only, keep it and remove from the tracking set
            if node_id in self.evaluation_only_nodes:
                log(INFO, "  ℹ️ Node %d: evaluation-only participant", node_id)
                self.evaluation_only_nodes.discard(node_id)
            eligible_messages.append(message)

        log(INFO, "  ├── Sampled: %d nodes", len(messages_list))
        log(INFO, "  ├── Eligible for evaluation: %d", len(eligible_messages))
        log(INFO, "  └── Excluded: %d", excluded_count)

        if excluded_count == 0:
            log(INFO, "  ✅ All sampled nodes included in evaluation\n")

        return eligible_messages

    def aggregate_evaluate(self, server_round: int, replies: Iterable[Message]) -> Optional[MetricRecord]:
        log(INFO, "\n📊 [Round %d] Evaluation Aggregation", server_round)
        replies_list = list(replies)
        log(INFO, "  ├── Received: %d evaluation results", len(replies_list))
        log(INFO, "  └── Including all evaluation results\n")
        _log_reply_metrics(server_round, replies_list)
        return super().aggregate_evaluate(server_round, replies_list)

    def _check_full_training_allowed(self, node_id: int, action: str = "train") -> tuple[bool, str]:
        """Delegate to validator; fail closed on errors."""
        try:
            return self.access_validator.is_allowed_full_training(node_id, action=action)
        except Exception as e:
            log(WARNING, "Error calling PEP for node %d: %s", node_id, e)
            return False, "PEP error - denied (fail closed)"

    def _check_evaluation_allowed(self, node_id: int) -> tuple[bool, str]:
        """Delegate to validator for evaluation checks; fail closed on errors."""
        try:
            return self.access_validator.is_allowed_to_evaluate(node_id)
        except Exception as e:
            log(WARNING, "Error calling PEP (evaluate) for node %d: %s", node_id, e)
            return False, "PEP error - denied (fail closed)"
