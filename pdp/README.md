# Luas Policy Decision Point (PDP)

A Node.js-based XACML 3.0 Policy Decision Point for federated learning access control. Evaluates authorisation requests against XACML policies to determine whether nodes can participate in training, aggregation, or evaluation tasks.

## Architecture

The PDP implements the XACML 3.0 standard with the following components:

- **Policy Engine** (`xacml/luas.js`): Core XACML evaluation engine
- **Policy Filter** (`xacml/policyFilter.js`): Bloom filter-based policy optimisation for fast policy matching
- **REST API** (`app.js`): HTTP interface for policy decision requests
- **Request Builder** (`utils/decisionParams.js`): Constructs XACML requests from query parameters

### How It Works

1. **Initialisation**: Loads XACML policies from XML files on startup
2. **Request Reception**: Receives HTTP GET requests with action and attribute parameters
3. **Request Construction**: Builds XACML request XML from query parameters
4. **Policy Evaluation**: Evaluates request against loaded policies using XACML engine
5. **Decision Response**: Returns JSON response with decision (Permit/Deny/Indeterminate/NotApplicable)

### Policy Structure

The PDP uses a task-scoped access control model with four policy types:

- **Task Authorisation**: Validates `task_id` and `task_expires` against current time
- **Node Activation**: Validates task membership and membership expiry
- **Training/Aggregation**: Requires `task_role="participant"` for training operations
- **Evaluation**: Allows `task_role` ∈ {`participant`, `observer`} for evaluation operations

Policies are evaluated using the deny-overrides combining algorithm with obligations for audit logging.

## Setup

### Prerequisites

- Node.js ≥ 20.9.0

### Installation

```bash
npm install
```

### Configuration

Set environment variables to customise behaviour:

```bash
# Server port (default: 3000)
export PORT=3000

# Policy files (comma-separated paths, default: ./policies/medical.xml)
export POLICY_FILES=/path/to/policy1.xml,/path/to/policy2.xml
```

### Running the PDP

```bash
# Production mode
npm start

# Development mode (with nodemon auto-reload)
npm run startdev
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns PDP initialisation status:
```json
{
  "status": "ready|initialising",
  "port": 3000
}
```

### Policy Decision

```bash
GET /getDecision?action=<action>&task_id=<task>&node_id=<node>
```

**Parameters:**
- `action`: Action type (`task-authorization`, `node-activation`, `train`, `evaluate`)
- `task_id`: Task identifier
- `node_id`: Node identifier (required for membership validation)

**Response:**
```json
{
  "decision": "Permit|Deny|Indeterminate|NotApplicable"
}
```

### Example Requests

```bash
# Task authorisation
curl 'http://localhost:3000/getDecision?action=task-authorization&task_id=medical'

# Node activation (membership validation)
curl 'http://localhost:3000/getDecision?action=node-activation&task_id=medical&node_id=12345'

# Training authorisation
curl 'http://localhost:3000/getDecision?action=train&task_id=medical&node_id=12345'

# Evaluation authorisation
curl 'http://localhost:3000/getDecision?action=evaluate&task_id=medical&node_id=12345'
```

## Testing

### Conformance Tests

Run XACML conformance test suite:

```bash
npm run conformance
```

### API Tests

Run API integration tests:

```bash
npm run api_test
```

## Performance Optimisation

The PDP uses Bloom filters to accelerate policy matching by pre-filtering policies based on attribute values. This reduces the number of policies that must be fully evaluated for each request.

To disable Bloom filters, modify `app.js`:

```javascript
PolicyFilter.getInstance(false);  // Disable Bloom filter optimisation
```

## Graceful Shutdown

The PDP handles `SIGTERM` and `SIGINT` signals gracefully, completing in-flight requests before shutdown (10-second timeout).

