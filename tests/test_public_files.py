"""Ensure publication checks catch private artifacts even after forced staging."""
from contextlib import redirect_stderr, redirect_stdout
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/check_public_files.py"
spec = importlib.util.spec_from_file_location("public_files_checker", SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class PublicationTests(unittest.TestCase):
    def check_paths(self, paths, root=None):
        listing = ("\0".join(paths) + "\0").encode()
        with patch.object(checker.subprocess, "check_output", return_value=listing):
            with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                if root is None:
                    return checker.main()
                with patch.object(checker, "ROOT", root):
                    return checker.main()

    def test_rejects_model_extensions_with_whitespace(self):
        for name in ["examples/final_model_default. pt", "checkpoint.  pt", "weights.PTH"]:
            with self.subTest(path=name):
                self.assertEqual(self.check_paths([name]), 1)

    def test_rejects_patient_partitions(self):
        for name in ["medical/interval_data/metadata.json", "medical/test_data/partition.csv",
                     "datasets/patients.txt", "private_data/metadata.json"]:
            with self.subTest(path=name):
                self.assertEqual(self.check_paths([name]), 1)

    def test_rejects_result_and_report_folders(self):
        for name in ["result/result", "results/summary.json", "reports/statistics.txt",
                     "output/metrics.json"]:
            with self.subTest(path=name):
                self.assertEqual(self.check_paths([name]), 1)

    def test_rejects_database_without_extension(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "runtime_store").write_bytes(b"SQLite format 3\x00" + b"\0" * 16)
            self.assertEqual(self.check_paths(["runtime_store"], root), 1)

    def test_allows_source_and_synthetic_policy_fixtures(self):
        self.assertEqual(self.check_paths([
            "examples/medical/task.py", "pdp/policies/medical.xml",
            "pdp/comformance/fl-tests/xacml_test_cases/test_cases.json",
        ]), 0)


if __name__ == "__main__":
    unittest.main()
