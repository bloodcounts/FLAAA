#!/usr/bin/env python3
"""Evaluate a saved global-model checkpoint on the pooled val_global.npz set.

Used ONLY for hyperparameter selection during the pilot search (never for the
final per-centre reported metric, which stays each centre's own held-out val
split). This keeps model-selection and reporting sets cleanly separated.
"""
import argparse
import sys

import numpy as np
import torch

sys.path.insert(0, ".")
from medical.task import DenseClassifier, get_interval_metadata, parse_hidden_dims, evaluate_model, AdultDataset
from torch.utils.data import DataLoader


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", required=True)
    ap.add_argument("--hidden_dims", default="64,32")
    args = ap.parse_args()

    hidden_dims = parse_hidden_dims(args.hidden_dims)
    input_dim = get_interval_metadata()["n_features"]
    model = DenseClassifier(input_dim=input_dim, output_dim=2, hidden_dims=hidden_dims, dropout=0.3)
    state_dict = torch.load(args.checkpoint, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()

    import os
    data = np.load(os.path.join(os.getenv("INTERVAL_DATA_DIR", "medical/interval_data"), "val_global.npz"))
    dataset = AdultDataset(data["x"], data["y"])
    loader = DataLoader(dataset, batch_size=128, shuffle=False)

    _, _, metrics = evaluate_model(model, loader, torch.device("cpu"))
    print(f"roc_auc={metrics['roc_auc']:.6f} accuracy={metrics['accuracy']:.6f}")


if __name__ == "__main__":
    main()
