#!/bin/bash
# Simple example: Start SuperLink with default settings

echo "Starting Custom Flower SuperLink..."
echo "=================================="
echo ""
echo "Configuration:"
echo "  Fleet API:      0.0.0.0:9092"
echo "  Control API:    0.0.0.0:9093"
echo "  ServerAppIo:    0.0.0.0:9091"
echo "  Database:       superlink.db"
echo "  Access Control: PEP enabled"
echo ""

cd "$(dirname "$0")/.."

python start_custom_superlink.py \
  --fleet-api-address 0.0.0.0:9092 \
  --control-api-address 0.0.0.0:9093 \
  --serverappio-api-address 0.0.0.0:9091 \
  --database superlink.db
