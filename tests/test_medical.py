"""Exercise FL clients and governance boundaries using synthetic data only."""
import importlib
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "examples"))
sys.path.insert(0, str(ROOT / "superlink"))

import torch
from flwr.app import ArrayRecord, ConfigRecord, Context, RecordDict
from medical import client_app, task
from medical.generate_synthetic_data import generate


class Validator:
    def __init__(self):
        self.revoked = set()
        self.calls = []

    def is_allowed_full_training(self, node_id, action="train"):
        self.calls.append((node_id, action))
        return node_id not in self.revoked, "test decision"

    def is_allowed_to_evaluate(self, node_id):
        self.calls.append((node_id, "evaluate"))
        return node_id not in self.revoked, "test decision"


class Grid:
    def get_node_ids(self):
        return [1, 2]


class MedicalIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(1)
        cls.temp = tempfile.TemporaryDirectory()
        generate(cls.temp.name, centres=2, samples=64, features=3)
        cls.env = patch.dict(os.environ, {"INTERVAL_DATA_DIR": cls.temp.name})
        cls.env.start()
        task._INTERVAL_METADATA_CACHE = None

    @classmethod
    def tearDownClass(cls):
        cls.env.stop()
        task._INTERVAL_METADATA_CACHE = None
        cls.temp.cleanup()

    def make_strategy(self, name, validator):
        modules = {
            "fedavg": ("fedavg_grid_with_filter", "FedAvgGridWithFilter"),
            "fedprox": ("fedprox_grid_with_filter", "FedProxGridWithFilter"),
            "fedper": ("fedper_grid_with_filter", "FedPerGridWithFilter"),
            "fedmap": ("fedmap_grid_with_filter", "FedMAPWithFilter"),
        }
        module, classname = modules[name]
        strategy_class = getattr(importlib.import_module("medical.access_control." + module), classname)
        kwargs = {}
        if name == "fedmap":
            model = task.DenseClassifier(3, 2, [4], 0)
            kwargs = {"icnn_modules": task.build_icnn_modules(model), "icnn_steps": 1}
        return strategy_class(validator, "test", **kwargs)

    def exercise_strategy(self, name):
        torch.manual_seed(42)
        validator = Validator()
        strategy = self.make_strategy(name, validator)
        arrays = ArrayRecord.from_torch_state_dict(task.DenseClassifier(3, 2, [4], 0).state_dict())
        config = ConfigRecord({"local_epochs": 1, "learning_rate": 0.001,
                               "batch_size": 16, "hidden_dims": "4", "dropout": 0.0})
        contexts = {n: Context(1, n, {"partition-id": n-1}, RecordDict(), {}) for n in [1, 2]}
        personal_heads = None
        for round_number in [1, 2]:
            messages = list(strategy.configure_train(round_number, arrays, config, Grid()))
            replies = [client_app.train(msg, contexts[msg.metadata.dst_node_id]) for msg in messages]
            self.assertEqual(len(replies), 2)
            reply_one = next(reply for reply in replies if reply.metadata.src_node_id == 1)
            if name == "fedper":
                self.assertIn("fedper_head", contexts[1].state)
                # The client transmits the original global placeholder for its head.
                for key in task.last_linear_parameter_names(task.DenseClassifier(3, 2, [4], 0)):
                    self.assertTrue(torch.equal(reply_one.content["arrays"].to_torch_state_dict()[key], arrays.to_torch_state_dict()[key]))
                personal_heads = contexts[1].state["fedper_head"].to_torch_state_dict()
            # Revoke a node after it has trained, before aggregation.
            validator.revoked = {2}
            arrays, metrics = strategy.aggregate_train(round_number, replies)
            self.assertIsNotNone(arrays)
            self.assertIsNotNone(metrics)
            self.assertIn((2, "aggregate"), validator.calls)
            self.assertTrue(torch.equal(arrays.to_torch_state_dict()["net.0.weight"], reply_one.content["arrays"].to_torch_state_dict()["net.0.weight"]))
            evaluations = list(strategy.configure_evaluate(round_number, arrays, config, Grid()))
            self.assertEqual([m.metadata.dst_node_id for m in evaluations], [1])
            evaluation_replies = [client_app.evaluate(msg, contexts[1]) for msg in evaluations]
            result = strategy.aggregate_evaluate(round_number, evaluation_replies)
            self.assertIsNotNone(result)
            self.assertIn("roc_auc", result)
            validator.revoked = set()
        if personal_heads is not None:
            model = task.DenseClassifier(3, 2, [4], 0)
            client_app._restore_fedper_head(model, contexts[1], True)
            for key, value in personal_heads.items():
                self.assertTrue(torch.equal(model.state_dict()[key], value))

    def test_fedavg(self):
        self.exercise_strategy("fedavg")

    def test_fedprox(self):
        self.exercise_strategy("fedprox")

    def test_fedper(self):
        self.exercise_strategy("fedper")

    def test_fedmap(self):
        self.exercise_strategy("fedmap")

    def test_no_permitted_updates(self):
        for name in ["fedavg", "fedprox", "fedper", "fedmap"]:
            with self.subTest(strategy=name):
                validator = Validator()
                validator.revoked = {1, 2}
                strategy = self.make_strategy(name, validator)
                arrays = ArrayRecord.from_torch_state_dict(task.DenseClassifier(3, 2, [4], 0).state_dict())
                self.assertEqual(list(strategy.configure_train(1, arrays, ConfigRecord(), Grid())), [])
                self.assertEqual(strategy.aggregate_train(1, []), (None, None))

    def test_strategy_distribution_matches_app(self):
        for name in ["fedavg", "fedprox", "fedper", "fedmap"]:
            filename = name + "_grid_with_filter.py"
            self.assertEqual((ROOT / "aggregation-strategies/strategies" / filename).read_text(),
                             (ROOT / "examples/medical/access_control" / filename).read_text())

    def test_pep_fail_closed_and_policy_pinning(self):
        from medical.access_control.policy_enforcement_point import PolicyEnforcementPoint
        with patch.dict(os.environ, {"EXTERNAL_ACL_POLICY_VERSION": "study-v1"}):
            pep = PolicyEnforcementPoint(endpoint="https://localhost/getDecision", task_id="test")
        for response in ["Permit", {}, {"decision": "Deny", "allow": True},
                         {"decision": "Permit", "policy": {"version": "wrong"}}]:
            with self.subTest(response=response), patch.object(pep, "_call_pdp", return_value=(200, response)):
                self.assertFalse(pep.check_node_allowed_full_training(1))
        permit = {"decision": "Permit", "policy": {"version": "study-v1"}}
        with patch.object(pep, "_call_pdp", return_value=(200, permit)) as call:
            self.assertTrue(pep.check_node_allowed_full_training(1))
            self.assertTrue(pep.check_node_allowed_full_training(1))
            self.assertEqual(call.call_count, 2)

    def test_coordinator_uses_configured_study(self):
        from custom_fleet.policy_enforcement_point import PolicyEnforcementPoint
        with patch.dict(os.environ, {"EXTERNAL_ACL_TASK_ID": "study-123", "PDP_DECISION_URL": "https://localhost/getDecision"}):
            pep = PolicyEnforcementPoint()
        with patch.object(pep.client, "_call_pdp", return_value=(200, {"decision": "Permit"})) as call:
            self.assertTrue(pep.is_task_approved(9876)[0])
            self.assertEqual(call.call_args.args[0]["task_id"], "study-123")

    def test_coordinator_fleet_api_compatibility(self):
        from custom_fleet.custom_fleet_servicer import CustomFleetServicer
        from flwr.server.superlink.fleet.grpc_rere.fleet_servicer import FleetServicer
        from types import SimpleNamespace
        from unittest.mock import Mock
        with patch("custom_fleet.custom_fleet_servicer.PolicyEnforcementPoint") as policy:
            servicer = CustomFleetServicer(Mock(), Mock(), False)
        policy.return_value.is_task_approved.return_value = (False, {"decision": "Deny"})
        context = Mock()
        context.abort.side_effect = RuntimeError("permission denied")
        with patch.object(FleetServicer, "GetRun") as parent:
            with self.assertRaisesRegex(RuntimeError, "permission denied"):
                servicer.GetRun(SimpleNamespace(run_id=1), context)
            parent.assert_not_called()
        policy.return_value.is_task_approved.return_value = (True, {"decision": "Permit"})
        with patch.object(FleetServicer, "GetRun", return_value="approved run") as parent:
            request = SimpleNamespace(run_id=1)
            self.assertEqual(servicer.GetRun(request, context), "approved run")
            parent.assert_called_once_with(request, context)


if __name__ == "__main__":
    unittest.main()
