# Flower SuperLink with Access Control

A customized Flower SuperLink implementation that integrates external access control through a Policy Enforcement Point (PEP). This component enables fine-grained authorization for federated learning tasks based on external policy decisions.

## Overview

This SuperLink extends the standard Flower SuperLink with:

- **Policy Enforcement Point (PEP)**: Intercepts task requests and validates them against external policies
- **Custom Fleet Servicer**: Enhanced fleet management with access control checks
- **Task Authorization**: Controls which nodes can participate in specific federated learning tasks
- **Flexible Integration**: Works with external Policy Decision Points (PDPs) like Luas-PDP

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Client    │────────▶│  Custom Fleet    │────────▶│  External   │
│   Nodes     │         │    Servicer      │         │     PDP     │
└─────────────┘         │   (with PEP)     │         │             │
                        └──────────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   SuperLink      │
                        │   Core Services  │
                        │  - Fleet API     │
                        │  - Control API   │
                        │  - ServerAppIo   │
                        └──────────────────┘
```

## Components

### 1. Custom Fleet Servicer

Located in `custom_fleet/custom_fleet_servicer.py`, this component:

- Extends the standard Flower `FleetServicer`
- Integrates a Policy Enforcement Point (PEP)
- Intercepts `GetRun`, `PullMessages`, and `PushMessages` calls
- Validates task authorization before allowing node participation

### 2. Policy Enforcement Point (PEP)

Located in `custom_fleet/policy_enforcement_point.py`, this component:

- Communicates with external Policy Decision Points
- Caches authorization decisions for performance
- Provides task approval validation
- Returns detailed decision information

### 3. Configuration

Located in `custom_fleet/config.py`:

- Manages PDP connection settings
- Configurable via environment variables
- Supports both HTTP and gRPC PDPs

## Installation

### Prerequisites

- Python 3.8+
- Flower framework (`flwr`)
- Access to a Policy Decision Point (e.g., Luas-PDP)

### Install Dependencies

```bash
pip install -r requirements.txt
```

Or install from the project root:

```bash
pip install -e .
```

## Usage

### Basic Usage

Start the custom SuperLink with default settings:

```bash
python start_custom_superlink.py
```

### With SSL/TLS

```bash
python start_custom_superlink.py \
  --ssl-certfile /path/to/server.crt \
  --ssl-keyfile /path/to/server.key \
  --ssl-ca-certfile /path/to/ca.crt
```

### Custom Addresses

```bash
python start_custom_superlink.py \
  --fleet-api-address 0.0.0.0:9092 \
  --control-api-address 0.0.0.0:9093 \
  --serverappio-api-address 0.0.0.0:9091
```

### With SuperNode Authentication

```bash
python start_custom_superlink.py \
  --enable-supernode-auth
```

### Using the Bash Script

A convenience script is provided:

```bash
./run.bash
```

## Configuration

### Environment Variables

Configure the PDP connection using environment variables:

```bash
export PDP_HOST=localhost
export PDP_PORT=8080
export PDP_PROTOCOL=http
```

See `custom_fleet/config.py` for all available options.

### Database

By default, the SuperLink uses SQLite:

```bash
--database superlink.db
```

## Command-Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--fleet-api-address` | `0.0.0.0:9092` | Fleet API address for client connections |
| `--control-api-address` | `0.0.0.0:9093` | Control API address for run management |
| `--serverappio-api-address` | `0.0.0.0:9091` | ServerAppIo API address (internal) |
| `--database` | `superlink.db` | Path to SQLite database |
| `--isolation` | `subprocess` | Isolation mode for ServerApp |
| `--ssl-certfile` | None | Path to SSL certificate file |
| `--ssl-keyfile` | None | Path to SSL private key file |
| `--ssl-ca-certfile` | None | Path to SSL CA certificate file |
| `--enable-supernode-auth` | False | Enable SuperNode authentication |

## Access Control Flow

1. **Client requests task** → `GetRun()` called
2. **PEP validates** → Queries external PDP with run_id
3. **Decision returned** → Permit/Deny with obligations
4. **Task delivered** → Only if permitted
5. **Results submitted** → `PushMessages()` accepts submissions
6. **Strategy filters** → Aggregation strategy applies final filtering

## Integration with Aggregation Strategies

This SuperLink works seamlessly with custom aggregation strategies that implement additional filtering:

- **Task-level control**: PEP controls which nodes can receive tasks
- **Aggregation-level control**: Strategy controls which results are aggregated
- **Two-layer security**: Defense in depth for access control

See the `aggregation-strategies` component for compatible strategies.

## Logging

The SuperLink provides detailed logging:

- `INFO`: Normal operations, task delivery, access decisions
- `WARNING`: Denied access, policy violations
- `ERROR`: System errors, PDP communication failures
- `DEBUG`: Detailed message flow (enable in custom_fleet_servicer.py)

## Examples

See the `examples/` directory for:

- Simple single-federation setup
- Multi-federation with different policies
- Integration with Luas-PDP
- Custom policy examples

## Development

### Project Structure

```
superlink/
├── start_custom_superlink.py    # Main entry point
├── run.bash                      # Convenience script
├── custom_fleet/
│   ├── __init__.py
│   ├── custom_fleet_servicer.py # Custom fleet servicer with PEP
│   ├── policy_enforcement_point.py # PEP implementation
│   └── config.py                # Configuration management
├── examples/                     # Usage examples
├── requirements.txt              # Python dependencies
├── pyproject.toml               # Package configuration
└── README.md                    # This file
```

### Extending the PEP

To customize the Policy Enforcement Point:

1. Edit `custom_fleet/policy_enforcement_point.py`
2. Modify the `is_task_approved()` method
3. Add custom decision caching logic
4. Implement additional validation checks

## Troubleshooting

### PDP Connection Issues

If the SuperLink cannot connect to the PDP:

1. Check PDP is running: `curl http://localhost:8080/health`
2. Verify environment variables are set correctly
3. Check firewall rules
4. Review PEP logs for connection errors

### Task Authorization Failures

If tasks are being denied:

1. Check PDP logs for decision details
2. Verify policies are loaded correctly
3. Review XACML request/response in PEP logs
4. Ensure run_id matches policy expectations

### Database Locked

If you see database locked errors:

1. Ensure only one SuperLink instance is running
2. Delete `.db-shm` and `.db-wal` files
3. Check file permissions

## Related Components

- **[aggregation-strategies](../aggregation-strategies/)**: Custom FL strategies with access control
- **[pdp](../pdp/)**: Luas Policy Decision Point
- **[example](../example/)**: Full working example


## Contributing

Contributions are welcome! Please ensure:

- Code follows existing style
- Tests pass
- Documentation is updated
- Access control logic is thoroughly tested
