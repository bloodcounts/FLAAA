# Governed federated learning example

The medical application trains a binary classifier on centre-partitioned data using Flower's message-based ServerApp and ClientApp APIs.

## Installation

From the repository root:

```bash
pip install -e ./examples
npm ci --prefix pdp
```

## Synthetic smoke run

Generate independent synthetic partitions outside the source tree. This command does not read patient data:

```bash
python examples/medical/generate_synthetic_data.py --output-dir /tmp/flaaa-synthetic --centres 2
export INTERVAL_DATA_DIR=/tmp/flaaa-synthetic
cd examples
export FLWR_HOME=/tmp/flaaa-flower
mkdir -p "$FLWR_HOME"
cp flwr-config.toml "$FLWR_HOME/config.toml"
flwr run . local-simulation --run-config 'num_rounds=2 min_available_clients=2 governance_enabled=false strategy="fedavg"' --federation-config 'num-supernodes=2 init-args-num-cpus=2' --stream
```

`governance_enabled=false` selects an ungoverned comparison run. Governed runs require an HTTPS PDP and explicit study membership.

## Governed runs

Configure the PDP as described in [pdp/README.md](../pdp/README.md). In the application process, set:

```bash
export EXTERNAL_ACL_API_ENDPOINT=https://localhost:8080/getDecision
export EXTERNAL_ACL_TASK_ID=medical
export PDP_CA_CERT_PATH=/path/to/trusted-ca.crt
export INTERVAL_DATA_DIR=/path/to/prepared-centres
```

Provision the study and node memberships in the PDP's `PIP_DATA_PATH` file. Set `EXTERNAL_ACL_POLICY_VERSION` and/or `EXTERNAL_ACL_POLICY_SHA256` to pin an expected policy. Each HTTP attempt uses `EXTERNAL_ACL_TIMEOUT` seconds (default 5), with `EXTERNAL_ACL_RETRY_COUNT` immediate retries (default 2). Fail-open mode is unsupported. `PEP_FAILURE_LOG_PATH` records local request failures when configured.

For a local simulation, `register_simulated_nodes=true` explicitly grants its discovered node IDs participant membership in a test PIP. It requires the application and PDP to share `PIP_DATA_PATH`. The default is `false`; use operator-managed policy data for deployed runs.

## Strategies

Select a strategy with `--run-config 'strategy="fedprox"'` or the corresponding setting in `pyproject.toml`.

| Strategy | Training and aggregation |
| --- | --- |
| `fedavg` | Sample-count-weighted averaging |
| `fedprox` | FedAvg with the client-side proximal penalty; `proximal_mu` defaults to 0.01 |
| `fedper` | Shared model layers with the final linear layer retained in each client's Flower context |
| `fedmap` | Local MAP estimation with an ICNN prior and contribution-weighted model aggregation |

Training instructions, returned training updates and evaluation instructions are filtered through the PEP. Authorisation is rechecked at aggregation, so membership can be revoked after scheduling. FedPer retains its personal head in client context; the saved global model contains the shared model and the global head placeholder. FedMAP retains its local MAP model in client context for evaluation. Its final global model file contains classifier parameters; it does not include the learned ICNN prior or client state for resuming training.

`fraction_train`, `fraction_evaluate` and `min_available_clients` control sampling. `local_epochs`, `learning_rate`, `batch_size`, `hidden_dims` and `dropout` configure the classifier. Completed runs save `final_model_<federation>.pt` locally.

## Private data preparation

The preparation utility takes existing centre-specific train and held-out splits:

```bash
python examples/medical/prepare_interval_data.py \
  --input-dir /secure/INTERVAL_by_centre \
  --output-dir /secure/prepared-centres --centres 25
```

Inputs are named `INTERVAL_irondef_<centre>_train.csv` and `INTERVAL_irondef_<centre>_val.csv`. The target is `ferritin_low`; the utility excludes the target, `FERR`, `identifier` and `Centre` from predictors. It fits imputation, scaling and categorical encoding on pooled training partitions. This preprocessing requires authorised access to those partitions. Each client's training partition is split again for local validation; its original held-out split is used only for evaluation. An optional `val_global.csv` is transformed for separate model selection.

Set `INTERVAL_DATA_DIR` to the prepared output directory. Private datasets and derived arrays must remain outside any shared source snapshot.

## Fault and metric instrumentation

`fault_profile` supports `nominal`, `latency`, `dropout`, `straggler` and `changing`. `fault_seed` selects deterministic faults; delay and fraction settings are in `pyproject.toml`. `METRICS_LOG_PATH` optionally writes per-node evaluation metrics to a local JSONL stream. These outputs are excluded from Git.
