# Custom Flower SuperLink

The custom Fleet servicer checks study approval through an HTTPS policy decision point before returning a run from `GetRun`. The medical ServerApp checks node activation and the aggregation strategies check training, returned updates and evaluation. Authentication uses Flower's SuperNode support; enable and provision it for a deployed federation.

## Configuration

Install with `pip install -e ./superlink` from the repository root. Flower is pinned to 1.36.0 because this component imports runtime internals. The Docker image also installs gRPC reflection.

Set `PDP_DECISION_URL` (or `EXTERNAL_ACL_API_ENDPOINT`) to an HTTPS `/getDecision` URL, `EXTERNAL_ACL_TASK_ID` to the approved study identifier, and `PDP_CA_CERT_PATH` when the PDP uses a private CA. A coordinator is bound to the configured study; Flower run IDs identify executions within it. Use separate coordinator configurations for other studies.

The PEP accepts a structured, consistent `Permit` response, checks optional policy-version and digest pins, and denies transport errors or malformed responses. It makes a fresh request for every study-approval check. `EXTERNAL_ACL_RETRY_COUNT` controls immediate retries; no background retries occur.

From `superlink/`, a TLS-enabled launch is:

```bash
python start_custom_superlink.py \
  --host 127.0.0.1 --port 9091 \
  --ssl-certfile /path/to/server.crt \
  --ssl-keyfile /path/to/server.key \
  --ssl-ca-certfile /path/to/ca.crt
```

The default gRPC ports are 9092 for Fleet and 9093 for Control. The launch command above selects port 9091 for the Runtime HTTP API; Flower defaults to port 8000. Restrict this API to coordinator application processes, or configure separate runtime TLS credentials. Keep TLS credentials and Flower state outside shared source snapshots.

See [platform.README.md](../platform.README.md) for the Compose configuration and [pdp/README.md](../pdp/README.md) for policy information and audit verification.
