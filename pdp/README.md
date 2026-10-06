# Policy decision point

The Node.js PDP evaluates XACML policies and serves `Permit`, `Deny`, `NotApplicable` or `Indeterminate` decisions. FLA³ PEP clients proceed only after a structured, consistent `Permit` response.

## Install and run

Use Node.js 20.9 or later. From `pdp/`, run `npm ci` and `npm start`. `PDP_PORT` defaults to 3000 when started directly; Compose sets it to 8080. `GET /health` reports readiness and `/docs` serves API documentation.

PEP clients require HTTPS. Set `TLS_CERT_PATH` and `TLS_KEY_PATH` for direct TLS, or deploy behind a trusted TLS proxy. Set `PDP_CA_CERT_PATH` in Python clients when using a private CA. Signing keys are distinct from TLS credentials.

## Policy information

`PIP_DATA_PATH` selects an operator-maintained JSON file. Its default is `sample_data/nodes.json`, which is created locally and excluded from Git. Study and node attributes are reread for each decision. A minimal schema is:

```json
{
  "tasks": {
    "medical": {
      "task_expires": "2027-12-31T23:59:59Z",
      "nodes": {
        "123": {
          "is_member_of_task": true,
          "task_membership_expires": "2027-12-31T23:59:59Z",
          "task_role": "participant"
        }
      }
    }
  }
}
```

Supply each permitted node explicitly. Use `observer` for evaluation-only membership. Expired approvals and memberships block their corresponding actions. Missing or malformed policy attributes fail closed at the PEP.

`GET /getDecision` accepts `action`, `task_id` and, for node actions, `node_id`. Actions are `task_approval`, `membership_validation`, `train`, `aggregate` and `evaluate`. Responses include a decision object and `policy` metadata containing the deployment version and the SHA-256 digest of loaded policy bytes. `POLICY_FILES` selects comma-separated policy files; changing loaded policies requires restarting the PDP. `POLICY_VERSION` supplies a human-readable version.

## Signed accounting

Create a P-256 key pair locally:

```bash
mkdir -p certs logs
openssl ecparam -genkey -name prime256v1 -noout -out certs/pdp_sign_key.pem
openssl ec -in certs/pdp_sign_key.pem -pubout -out certs/pdp_sign_pub.pem
export REQUIRE_ES256_SIGNING=true
export SIGNING_KEY_PATH="$PWD/certs/pdp_sign_key.pem"
export SIGNING_KID=pdp-key-1
export AUDIT_LOG_PATH="$PWD/logs/audit.jsonl"
export AUDIT_CHECKPOINT_PATH=/path/to/independent-storage/checkpoints.jsonl
export AUDIT_CHECKPOINT_EVERY=50
npm start
```

Create the checkpoint directory before startup and ensure both output paths are writable. A record includes the decision, timestamp, subject, action, study, policy metadata, sequence and preceding event hash. The JWS uses ES256; the event hash commits to the persisted signed record. Each checkpoint signs a sequence number and corresponding event hash.

| Variable | Default | Purpose |
| --- | --- | --- |
| `REQUIRE_ES256_SIGNING` | `false` | Reject startup without a signing key and deny decisions on audit failure |
| `SIGNING_KEY_PATH` | `certs/pdp_sign_key.pem` | P-256 private key |
| `SIGNING_KID` | `pdp-signing-key` | Public-key identifier in signatures |
| `AUDIT_LOG_PATH` | unset | Dedicated append-only JSONL audit stream |
| `AUDIT_CHECKPOINT_PATH` | `<AUDIT_LOG_PATH>.checkpoints.jsonl` | Signed checkpoint stream |
| `AUDIT_CHECKPOINT_EVERY` | `50` | Positive integer checkpoint interval |
| `DECISION_AUDIT_ENABLED` | `true` | Disable only for measurements without required signing |

Mandatory signing prevents an audit failure from producing an unsigned permit. After a mandatory write failure, restart the writer after inspecting its retained files. Startup checks retained chain continuity and checkpoint anchors before appending. Use the cryptographic verifier before resuming from archived storage.

## Verify accounting

From `pdp/`:

```bash
node scripts/verify_audit.js /path/to/audit.jsonl /path/to/checkpoints.jsonl \
  pdp-key-1=/path/to/pdp-key-1-public.pem \
  pdp-key-2=/path/to/pdp-key-2-public.pem
```

The combined verifier requires signatures on every record and checkpoint, selects public keys by `kid`, binds the readable record to the signed payload, and checks event hashes, sequence continuity and checkpoint anchors. Keep all public keys needed for retained records when rotating the signing key. Checkpoints and public-key history must be retained independently of the active log.

Individual tools remain available: `verify_logs.js` checks operational-log signatures, `verify_logs.js --chain` checks dedicated-stream hashes and anchors, and `verify_checkpoints.js` checks checkpoint signatures. Use `verify_audit.js` for a complete signed-stream check.

A trusted checkpoint detects truncation before its anchored sequence. Deletion after the latest checkpoint and events never logged cannot be detected by this mechanism. Separate source snapshots from runtime audit files and credentials.

## Tests

```bash
npm test
npm run conformance
```
