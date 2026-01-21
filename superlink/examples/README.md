# Examples

This directory contains example configurations and scripts for running the Custom Flower SuperLink.

## Available Examples

### 1. Simple Start (`start_simple.sh`)

Basic SuperLink startup with default settings:
- No SSL/TLS
- Default ports
- PEP enabled

```bash
./start_simple.sh
```

### 2. SSL/TLS Start (`start_with_ssl.sh`)

SuperLink with SSL/TLS encryption:
- Requires certificates in `./certs/` directory
- Secure Fleet and Control APIs
- ServerAppIo remains localhost-only

```bash
# Generate certificates first (example using OpenSSL)
mkdir -p certs
# ... generate your certificates ...

# Then start
./start_with_ssl.sh
```

### 3. Environment Configuration (`config.env.example`)

Example environment variables for configuration:

```bash
# Copy and customize
cp config.env.example config.env
# Edit config.env with your settings
source config.env

# Start SuperLink
python ../start_custom_superlink.py
```

## Integration Examples

### With Luas-PDP

1. Start the PDP server:
```bash
cd ../../pdp
npm start
```

2. Configure PDP connection:
```bash
export PDP_HOST=localhost
export PDP_PORT=8080
export PDP_PROTOCOL=http
```

3. Start SuperLink:
```bash
./start_simple.sh
```

### With Custom Aggregation Strategy

See the `../example/` directory for a complete Flower app that uses:
- This custom SuperLink
- Custom aggregation strategies with filtering
- Luas-PDP for policy enforcement

## Testing

To verify the SuperLink is running:

```bash
# Check if Fleet API is accessible
grpcurl -plaintext localhost:9092 list

# Check if Control API is accessible
grpcurl -plaintext localhost:9093 list
```

## Troubleshooting

### Port Already in Use

If you see "Address already in use" errors:

```bash
# Find and kill existing process
lsof -ti:9092 | xargs kill -9
lsof -ti:9093 | xargs kill -9
```

### PDP Connection Failed

Ensure the PDP is running and accessible:

```bash
curl http://localhost:8080/health
```

### Database Locked

Remove stale database files:

```bash
rm -f superlink.db-shm superlink.db-wal
```
