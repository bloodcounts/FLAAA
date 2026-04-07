# PDP — Modernisation Changelog

**Date:** 2026-02-24

---

## Summary

Modernised the Node.js PDP (Policy Decision Point) application without changing any core XACML engine behaviour. Changes focused on clean code, class-based architecture, input validation, structured logging, OpenAPI documentation, and containerisation.

---

## Dependencies (`package.json`)

- Added `joi` — query parameter validation
- Added `pino` — structured JSON logger (replaces Winston)
- Added `pino-http` — HTTP request logging middleware (replaces Morgan)
- Added `pino-roll` — daily rotating file transport for Pino
- Added `swagger-jsdoc` — OpenAPI spec generation from JSDoc
- Added `swagger-ui-express` — Swagger UI server
- Removed `winston`, `winston-daily-rotate-file`, `morgan`
- Moved `chai`, `mocha`, `nodemon` to `devDependencies`
- Removed `body-parser` implicit coupling (kept but only in `app.js`)
- Added `"dev": "nodemon app.js"` script

---

## Refactored: Prototype → ES6 Classes

### `xacml/luas.js`
- Converted `function Luas` + `Luas.prototype.*` methods to `class Luas`
- `getPDPInstance` replaced with `static async create(policyFiles)` factory method
- `evaluateCallBack` renamed `_evaluateCallBack` (private convention)
- `getFullObligationsFromPolicy` renamed `_getFullObligationsFromPolicy`
- Module-level helpers `readFileToStream` / `parseRes` extracted as private module functions `_readFileToStream` / `_parseDecision`
- `@xmldom/xmldom` `DOMParser` moved to top-level import (removed inline `require`)

### `utils/decisionParams.js`
- Converted to `class DecisionParamsBuilder` with private static methods (`#escapeXml`, `#buildTaskApproval`, `#buildMembershipValidation`, `#buildMembershipType`)
- Public API: `DecisionParamsBuilder.build(action, params)`
- Fixed typos in switch aliases while retaining backward-compat (`taks_approval`, `memebership_validation`)
- Multiline template literals replacing single-line escaped strings

### `utils/policyInformationPoint.js`
- Converted to `class PolicyInformationPoint`
- Exports a singleton instance
- `_readData()` instance method (internal)
- Public methods: `getTaskPolicyInfo`, `getMembershipInfo`, `getMembershipTypeInfo`

### `utils/decisionLogger.js`
- Converted to `class DecisionLogger`
- Exports a singleton instance
- Logger, signing config, and key loading moved into constructor
- **Logger replaced:** Winston → Pino with `pino.transport()` targeting `pino-roll` (daily file rotation) and stdout
- Error objects logged as `{ err }` (Pino serialiser convention) instead of string interpolation
- Private methods: `_loadSigningKey`, `_signPayload`, `_getFirstAttributeValue`, `_extractFields`, `_policyRefsToArray`
- Public method: `log(decision, evaluationCtx, extras)`

---

## New Files

### `middleware/requestLogger.js`
- `pino-http` middleware sharing the singleton Pino logger from `decisionLogger`
- Logs each HTTP request/response as structured JSON with `req`/`res` fields

### `middleware/validate.js`
- Joi validation for `GET /getDecision` query parameters
- Validates `action` is a known value
- Per-action required field validation:
  - `task_approval` → requires `task_id`
  - `membership_validation` → requires `task_id`, `node_id`
  - `train` / `evaluate` → requires `task_id`
- Returns structured `400` on failure

### `middleware/errorHandler.js`
- Express 4-argument error handler `(err, req, res, next)`
- Logs errors via Pino
- Returns `{ error, stack? }` — stack omitted in production

### `routes/health.js`
- Extracted `GET /health` handler with OpenAPI JSDoc annotation
- Reads `luas` readiness from `app.locals`

### `routes/decision.js`
- Extracted `GET /getDecision` handler with full OpenAPI JSDoc annotation
- Uses `validateDecisionQuery` middleware
- Delegates to `DecisionParamsBuilder.build()`
- Passes errors to centralised error handler via `next(err)`

### `swagger.js`
- `swagger-jsdoc` config pointing at `routes/*.js` for annotation scanning
- Exports `{ spec, swaggerUi }` for mounting in `app.js`
- Swagger UI served at `GET /docs`

### `Dockerfile`
- `node:20-alpine` base image
- `npm ci --omit=dev` for lean production install
- Exposes port 3000

### `.dockerignore`
- Excludes `node_modules`, `logs`, `*.log`, `.env`, `certs`

### `docker-compose.yml`
- Single `pdp` service
- Environment: `PDP_PORT`, `LOG_LEVEL`, `NODE_ENV`
- Volume mount for `./logs`
- `restart: unless-stopped`

---

## Updated: `app.js`

- All `console.log` / `console.error` replaced with `logger.logger.*`
- Route handlers extracted to `routes/`
- Middleware stack: `requestLogger` → `bodyParser` → routes → `errorHandler`
- Swagger UI mounted at `/docs`
- `Luas.prototype.getPDPInstance()` replaced with `Luas.create()`
- `luas` instance and `port` exposed via `app.locals` for route handlers

---

## Files Not Changed

- `xacml/**` (except `luas.js`) — XACML engine untouched
- `policies/medical.xml`
- `conformance/` and `fl-tests/`
- `sample_data/`

---

## Additional Modernisation (2026-02-24)

### Code Quality & ES6 Classes

#### `utils/arrayUtil.js`
- Converted from prototype-based `ArrayUtil` to ES6 class
- Maintained `shuffle()` method with Fisher-Yates algorithm
- Improved code structure and maintainability

#### `utils/bloomFilter.js`
- Converted from prototype-based `BloomFilter` to ES6 class
- Added comprehensive ESLint disable comments for bitwise operations
- Maintained all hashing and filtering functionality
- Fixed linting issues while preserving performance

#### `utils/database.js`
- Converted from prototype-based `DbUtil` to ES6 class
- Implemented singleton pattern with `static getDb()` method
- Maintained all database operations: `recordServiceTime`, `recordResponse`

#### `app.js`
- Added descriptive comment for PolicyFilter singleton initialization
- Improved code documentation and readability

### Development Tools & Quality Assurance

#### `package.json`
- Added `depcheck` script for dependency analysis
- Added `husky` and `lint-staged` for pre-commit hooks
- Added `prepare` script for husky initialization
- Configured `lint-staged` to run ESLint on staged JavaScript files

#### Pre-commit Hooks
- Added XACML conformance tests to pre-commit hooks alongside ESLint
- Pre-commit now runs both code quality checks and policy correctness validation
- Prevents commits that break either code standards or policy evaluation logic

### Documentation Updates

#### Platform README (`../platform.README.md`)
- Updated log analysis section with correct file paths (`pdp.1.log` instead of `pdp.log`)
- Added smart commands for tailing latest logs automatically
- Added fallback handling for fresh repository clones
- Improved Docker Compose testing instructions

#### PDP README (`README.md`)
- Added documentation for pre-commit hooks
- Clarified automatic linting on commits

### Configuration & Security

#### `.gitignore`
- Added comprehensive ignore patterns for modern Node.js development
- Included environment files, certificates, IDE files, OS files, build outputs
- Added security-sensitive file patterns
- Enhanced with 40+ additional ignore rules

### Dependencies Added
- `husky` — Git hooks management
- `lint-staged` — Run linters on staged files
- (Note: `depcheck` was already available via npx)
