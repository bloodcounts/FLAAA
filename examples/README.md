# flwr-abac: Example apps

This folder contains example code showing how to run Flower-based applications with
an access-control integration (PEP/PDP) and simple PyTorch models. The focus is a
medical demo under `examples/medical` that demonstrates:

- a `ServerApp` that uses a custom Grid strategy with PEP-driven filtering
- a `ClientApp` that trains/evaluates a small dense classifier on partitioned CSVs
- helper scripts to generate keys, derive node IDs, and register SuperNodes

## Quick setup

Install the example dependencies from this directory (the `pyproject.toml` lists the
required packages):

```bash
pip install -e .
```

Then run the app (simulation runtime) from this directory:

```bash
flwr run .
```

## What is in this folder

- `pyproject.toml` — example app metadata and default `tool.flwr` config used when
  running `flwr run .` (federation names, default hyperparameters).
- `medical/` — a small end-to-end example demonstrating a federated training
  scenario with access control. See next section for details.

## `examples/medical` overview

- `server_app.py` — `ServerApp` that builds a global `DenseClassifier` and starts
  federation training using a custom Grid strategy (`FedAvgGridWithFilter` or
  `FedMAPWithFilter`) which delegates authorization decisions to an external
  Policy Enforcement Point (PEP).
- `client_app.py` — `ClientApp` implementing `@train` and `@evaluate` handlers.
  It loads a partitioned CSV dataset, applies local training/evaluation, and
  returns numeric metrics and model parameters via Flower `ArrayRecord`/`MetricRecord`.
- `task.py` — dataset loading, model definition (`DenseClassifier`), training
  and evaluation helper functions used by the client and server apps.
- `generate_node_keys.sh` — generates ED25519 keypairs for example nodes.
- `get_node_ids.py` — derives consistent numeric node IDs from public keys
  (prints a YAML snippet you can add to a `node_registry` for policies).
- `access_control/` — small PEP client + validators that call an external PDP
  endpoint to decide which nodes may train/evaluate. Aggregation strategy
  implementations (`FedAvgGridWithFilter`, `FedMAPWithFilter`) are provided in
  the top-level `aggregation-strategies` package and imported by the example
  server (see `/workspace/aggregation-strategies`).
- `test_data/` — partitioned CSVs used by the demo clients (partition_0.csv, ...).

Notes:
- `server_app.py` currently constructs an `ExternalAccessControlValidator` which
  uses `PolicyEnforcementPoint` to contact an external PDP. The default PDP URL
  is set in `access_control/policy_enforcement_point.py` (update it for your PDP).
- `task.py` expects partition CSVs. The local demo ships `examples/medical/test_data`.
  If you run the app from a different working directory, ensure `task.load_adult_data`
  points to the correct path or copy partition CSVs to the path expected by the code.

## Quick run (medical demo)

1. See the Flower documentation for how to authenticate and register SuperNodes:

   https://flower.ai/docs/framework/how-to-authenticate-supernodes.html

2. Run the example app (from `examples/`):

```bash
flwr run .
```

## Troubleshooting & notes

- If the PEP/PDP is not available the example validators default to "fail-open"
  in many places to allow local testing; inspect `examples/medical/access_control`.
- Adjust federation-specific settings (e.g. `num-server-rounds`, `local-epochs`,
  `fraction-train`) in `pyproject.toml` under `tool.flwr.app.config`.

If you want, I can (a) copy partition CSV paths into the locations expected by
`task.py`, (b) run a short local simulation, or (c) further expand the README with
examples of `tool.flwr` config overrides.
