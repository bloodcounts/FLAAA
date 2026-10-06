#!/usr/bin/env python3
"""Generate independent synthetic binary-classification centre partitions."""
import argparse
import json
from pathlib import Path

import numpy as np


def generate(output_dir, centres=2, samples=128, features=8, seed=42):
    if centres < 1 or samples < 32 or features < 1:
        raise ValueError("Use at least one centre, 32 samples, and one feature")
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    outputs = [output_dir / "metadata.json"] + [output_dir / f"centre_{n}.npz" for n in range(1, centres + 1)]
    if any(path.exists() for path in outputs):
        raise FileExistsError("Output already contains prepared data; choose an empty directory")
    rng = np.random.default_rng(seed)
    weights = rng.normal(size=features)
    for centre in range(1, centres + 1):
        x = rng.normal(loc=0.05 * centre, size=(samples, features)).astype(np.float32)
        logits = x @ weights + rng.normal(scale=0.5, size=samples)
        # Balanced classes in each split permit ROC-AUC evaluation on small demos.
        split = int(samples * 0.75)
        y = np.concatenate([
            (logits[:split] > np.median(logits[:split])).astype(np.int64),
            (logits[split:] > np.median(logits[split:])).astype(np.int64),
        ])
        np.savez(output_dir / f"centre_{centre}.npz",
                 x_train=x[:split], y_train=y[:split], x_val=x[split:], y_val=y[split:])
    (output_dir / "metadata.json").write_text(json.dumps({
        "n_features": features, "n_centres": centres, "synthetic": True, "seed": seed,
    }, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--centres", type=int, default=2)
    parser.add_argument("--samples", type=int, default=128)
    parser.add_argument("--features", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    generate(args.output_dir, args.centres, args.samples, args.features, args.seed)
    print(f"Synthetic partitions written to {args.output_dir}")


if __name__ == "__main__":
    main()
