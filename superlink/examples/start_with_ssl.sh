#!/bin/bash
# Example: Start SuperLink with SSL/TLS enabled

CERT_DIR="${CERT_DIR:-./certs}"

echo "Starting Custom Flower SuperLink with SSL/TLS..."
echo "================================================"
echo ""
echo "Configuration:"
echo "  Fleet API:      0.0.0.0:9092 (TLS)"
echo "  Control API:    0.0.0.0:9093 (TLS)"
echo "  ServerAppIo:    0.0.0.0:9091 (insecure, localhost)"
echo "  Certificates:   $CERT_DIR"
echo "  Access Control: PEP enabled"
echo ""

cd "$(dirname "$0")/.."

# Check if certificates exist
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ] || [ ! -f "$CERT_DIR/ca.crt" ]; then
    echo "ERROR: SSL certificates not found in $CERT_DIR"
    echo ""
    echo "Please generate certificates first:"
    echo "  mkdir -p $CERT_DIR"
    echo "  # Generate your SSL certificates"
    echo ""
    exit 1
fi

python start_custom_superlink.py \
  --fleet-api-address 0.0.0.0:9092 \
  --control-api-address 0.0.0.0:9093 \
  --serverappio-api-address 0.0.0.0:9091 \
  --database superlink.db \
  --ssl-certfile "$CERT_DIR/server.crt" \
  --ssl-keyfile "$CERT_DIR/server.key" \
  --ssl-ca-certfile "$CERT_DIR/ca.crt"
