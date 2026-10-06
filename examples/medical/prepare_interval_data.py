"""Prepare private centre-specific train and held-out arrays.

Excludes ferritin_low, FERR, identifier and Centre from predictors. Fits
numeric imputation and scaling, and categorical imputation and one-hot
encoding, on pooled training partitions. Held-out partitions are transformed
without fitting. Writes centre arrays and feature metadata to --output-dir.
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TARGET = "ferritin_low"
EXCLUDE = {TARGET, "FERR", "identifier", "Centre"}
N_CENTRES = 25

def read_centres(data_dir, n_centres):
    centres = []
    for centre in range(1, n_centres + 1):
        train_path = data_dir / f"INTERVAL_irondef_{centre}_train.csv"
        val_path = data_dir / f"INTERVAL_irondef_{centre}_val.csv"
        if not train_path.exists() or not val_path.exists():
            raise FileNotFoundError(f"Missing centre {centre} train/validation split")
        centres.append((centre, pd.read_csv(train_path), pd.read_csv(val_path)))
    return centres


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--centres", type=int, default=N_CENTRES)
    args = parser.parse_args()
    data_dir, out_dir = args.input_dir, args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    centres = read_centres(data_dir, args.centres)
    first = centres[0][1]
    features = [c for c in first.columns if c not in EXCLUDE]
    all_train = pd.concat([c[1][features] for c in centres], ignore_index=True)
    categorical = [c for c in features if not pd.api.types.is_numeric_dtype(all_train[c])]
    numeric = [c for c in features if c not in categorical]

    prep = ColumnTransformer(
        [
            ("numeric", Pipeline([("impute", SimpleImputer(strategy="median")),
                                   ("scale", StandardScaler())]), numeric),
            ("categorical", Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                                       ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), categorical),
        ],
        verbose_feature_names_out=False,
    )
    prep.fit(all_train)

    n_features = None
    for centre, train, val in centres:
        x_train = np.asarray(prep.transform(train[features]), dtype=np.float32)
        y_train = train[TARGET].to_numpy(dtype=np.int64)
        x_val = np.asarray(prep.transform(val[features]), dtype=np.float32)
        y_val = val[TARGET].to_numpy(dtype=np.int64)
        n_features = x_train.shape[1]
        np.savez(out_dir / f"centre_{centre}.npz",
                 x_train=x_train, y_train=y_train, x_val=x_val, y_val=y_val)
        print(f"centre {centre}: train={x_train.shape}, val={x_val.shape}")

    # Also transform the pooled global validation file (val_global.csv) with
    # the SAME fitted transformer, for use ONLY as a hyperparameter-selection
    # set (never as the reported per-centre test metric, which remains each
    # centre's own held-out val split above).
    global_val_path = data_dir / "val_global.csv"
    if global_val_path.exists():
        global_val_df = pd.read_csv(global_val_path)
        x_global = np.asarray(prep.transform(global_val_df[features]), dtype=np.float32)
        y_global = global_val_df[TARGET].to_numpy(dtype=np.int64)
        np.savez(out_dir / "val_global.npz", x=x_global, y=y_global)
        print(f"val_global: {x_global.shape}")

    metadata = {
        "n_features": int(n_features),
        "n_centres": args.centres,
        "target": TARGET,
        "excluded_features": sorted(EXCLUDE),
        "raw_feature_count": len(features),
        "categorical_features": categorical,
        "preprocessing": "aggregate-training median imputation + standardisation; one-hot categorical values",
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print("Wrote metadata:", metadata)


if __name__ == "__main__":
    main()
