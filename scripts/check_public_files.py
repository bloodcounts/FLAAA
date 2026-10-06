#!/usr/bin/env python3
"""Check Git's publication candidate paths for datasets and runtime artifacts."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_DIRS = {"data", "datasets", "dataset", "interval_data", "test_data", "INTERVAL_by_centre", "certificates", "certs", "logs", "checkpoints", "result", "results", "reports", "output", "outputs", "artifacts", "node_modules", ".venv", ".flwr", "__pycache__"}
PRIVATE_SUFFIXES = {".csv", ".tsv", ".parquet", ".feather", ".npz", ".npy", ".h5", ".hdf5", ".pt", ".pth", ".ckpt", ".jsonl", ".key", ".pem", ".crt", ".db", ".sqlite", ".sqlite3"}

def main():
    files = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT,
    ).decode().split("\0")
    rejected = []
    for name in set(filter(None, files)):
        path = Path(name)
        if (set(path.parts) & PRIVATE_DIRS or any(part.endswith("_data") for part in path.parts)
                or ("." + path.suffix[1:].strip().lower()) in PRIVATE_SUFFIXES
                or path.name.lower().startswith("final_model")
                or path.name == ".env" or path.name.startswith(".env.")
                or name in {"pdp/sample_data/node_ids.json", "pdp/sample_data/nodes.json"}):
            rejected.append(name)
            continue
        source = ROOT / path
        if source.is_file():
            with source.open("rb") as fh:
                header = fh.read(32)
            # Some runtime databases have no filename extension.
            if header.startswith(b"SQLite format 3\x00"):
                rejected.append(name)
    if rejected:
        print("Publication check failed; remove these files from Git tracking:", file=sys.stderr)
        print("\n".join(sorted(rejected)), file=sys.stderr)
        return 1
    print("Publication paths contain no datasets, model files, audit streams, or private keys.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
