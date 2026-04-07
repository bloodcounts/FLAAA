# Superlink Notes

---

## 2026-02-21



### `config.py` Overview

ACL configuration class


### `policy_enforcement_point.py` Overview

`PolicyEnforcementPoint` is the external policy decision client. Sends a GET request to a remote decision endpoint and parses the JSON response to determine Permit/Deny.

- Queries endpoint with `action=task_approval&task_id=<id>`
- Expects response shape: `{ "decision": { "decision": "Permit" } }`
- **Fail-closed**: if the endpoint is unreachable, defaults to Deny
- **Note:** `task_id` is currently hardcoded to `"medical"` on line 31 regardless of the actual run ID passed in

---

### `custom_fleet_servicer.py` Overview

`CustomFleetServicer` extends Flower's base `FleetServicer` using a decorator/proxy pattern — intercepting gRPC calls to add policy enforcement and logging without reimplementing core federated learning logic.

**Three intercepted gRPC methods:**

- **`GetRun`** — Main security gate. Checks `PolicyEnforcementPoint` (PEP) before allowing a node to access run info. Aborts with `PERMISSION_DENIED` if rejected.
- **`PullMessages`** — Passive monitoring only. Passes through to parent, adds logging for task delivery.
- **`PushMessages`** — Accepts all node result submissions (open mode). Filtering deferred to aggregation strategy.

**Key components:**
- `FleetServicer` — upstream Flower gRPC base class
- `PolicyEnforcementPoint` — external policy checker for task approval
- `state_factory` — provides access to run/node state
