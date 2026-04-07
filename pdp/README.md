# PDP — Policy Decision Point

A Node.js XACML 3.0 Policy Decision Point for federated learning governance. Evaluates access control policies and returns `Permit`, `Deny`, `NotApplicable`, or `Indeterminate` decisions.

---

## Requirements

- Node.js >= 20.9.0 (use `nvm use` — version pinned in `.nvmrc`)
- npm

---

## Installation

```bash
nvm use
npm install
```

---

## Running

```bash
# Production
npm start

# Development (hot-reload)
npm run dev

# Docker
docker compose up
```

---

## API

### `GET /health`

Returns the readiness status of the PDP.

```bash
curl http://localhost:8080/health
```

```json
{ "status": "ready", "port": 8080 }
```

---

### `GET /getDecision`

Evaluates an XACML policy decision for the given action and context.

**Query parameters**

| Parameter | Required | Description |
|---|---|---|
| `action` | Yes | One of: `task_approval`, `membership_validation`, `train`, `evaluate` |
| `task_id` | Yes | Federated learning task identifier (e.g. `medical`) |
| `node_id` | For `membership_validation` | SuperNode identifier |

**Examples**

```bash
# Task approval
curl "http://localhost:8080/getDecision?action=task_approval&task_id=medical"

# Node membership validation
curl "http://localhost:8080/getDecision?action=membership_validation&task_id=medical&node_id=15692499009958989137"

# Training authorisation
curl "http://localhost:8080/getDecision?action=train&task_id=medical"

# Evaluation authorisation
curl "http://localhost:8080/getDecision?action=evaluate&task_id=medical"
```

**Response**

```json
{
  "decision": {
    "decision": "Permit",
    "obligations": "[...]",
    "attributes": "[]",
    "reason": null,
    "message": null
  }
}
```

---

### `GET /docs`

Swagger UI — interactive API documentation available at [http://localhost:8080/docs](http://localhost:8080/docs).

OpenAPI path definitions live in `swagger/` as standalone YAML files.

---

## Certificate Setup

Generate the EC signing key used for JWS audit log signing:

```bash
# From the FLAAA root — also generates superlink SSL certs
bash scripts/generate_certs.sh
```

Or standalone from `pdp/`:

```bash
mkdir -p certs
openssl ecparam -genkey -name prime256v1 -noout -out certs/pdp_sign_key.pem
openssl ec -in certs/pdp_sign_key.pem -pubout -out certs/pdp_sign_pub.pem
```

The `certs/` directory is gitignored. If no signing key is present the PDP starts normally but JWS signing is disabled (a warning is logged).

---

## Configuration

| Environment variable | Default | Description |
|---|---|---|
| `PDP_PORT` | `8080` | HTTP port |
| `POLICY_FILES` | `./policies/medical.xml` | Comma-separated policy file paths |
| `LOG_LEVEL` | `info` | Pino log level |
| `NODE_ENV` | — | Set to `production` to suppress stack traces in error responses |
| `SIGNING_KEY_PATH` | `./certs/pdp_sign_key.pem` | Path to EC private key for JWS audit log signing |
| `SIGNING_KID` | `pdp-signing-key` | Key ID embedded in JWS header |
| `SIGNING_ALG` | `ES256` | JWS signing algorithm |

---

## Policy Data

Node and task context is read from `sample_data/nodes.json`. Structure:

```json
{
  "tasks": {
    "medical": {
      "task_expires": "2027-12-31T23:59:59Z",
      "nodes": {
        "<node_id>": {
          "is_member_of_task": true,
          "task_membership_expires": "2027-12-31T23:59:59Z",
          "task_role": "participant"
        },
        "default": { "..." : "..." }
      }
    }
  }
}
```

---

## Project Structure

```
pdp/
├── app.js                          # Entry point — Express setup, init
├── .nvmrc                          # Node version pin
├── routes/
│   ├── health.js                   # GET /health
│   └── decision.js                 # GET /getDecision
├── middleware/
│   ├── requestLogger.js            # pino-http HTTP logging
│   ├── validate.js                 # Joi query param validation
│   └── errorHandler.js             # Centralised error handler
├── utils/
│   ├── decisionParams.js           # Builds XACML XML requests (class)
│   ├── policyInformationPoint.js   # Reads task/node context (class)
│   └── decisionLogger.js           # Audit logging with JWS signing (class)
├── swagger/
│   ├── decision.yaml               # OpenAPI path definition for /getDecision
│   └── health.yaml                 # OpenAPI path definition for /health
├── swagger.js                      # swagger-jsdoc + Swagger UI setup
├── xacml/                          # XACML 3.0 engine (do not modify)
│   └── luas.js                     # PDP wrapper (ES6 class)
├── policies/
│   └── medical.xml                 # FL governance policy
├── sample_data/
│   └── nodes.json                  # Task and node policy context
├── Dockerfile
└── docker-compose.yml
```

---

## Linting

```bash
npm run lint
npm run lint:fix
```

**Pre-commit hooks**: Linting and XACML conformance tests are automatically run before each commit using `husky` and `lint-staged`. This ensures code quality standards and policy correctness are maintained.

---

## Tests

```bash
# XACML conformance tests
npm run conformance
```

---

## Docker

```bash
# Build and run
docker compose up

# Build only
docker build -t pdp .
```

