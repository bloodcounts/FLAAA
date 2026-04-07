#!/bin/bash

set -e

# Configuration
CERT_DIR="/app/.flwr"
FEDERATION="cancer-detection"
NUM_CLIENTS=5

echo "=================================================="
echo "==> Registering $NUM_CLIENTS SuperNodes to '$FEDERATION'"
echo "=================================================="

for i in $(seq 1 $NUM_CLIENTS); do
    # Define the key path (matches the keys you generated earlier)
    KEY_FILE="$CERT_DIR/node${i}/node${i}.pub"

    if [ -f "$KEY_FILE" ]; then
        echo -n "   -> Client $i: "
        # Run the registration command
        flwr supernode register "$KEY_FILE" "$FEDERATION"
    else
        echo "   ❌ Warning: Public key for Client $i not found at $KEY_FILE"
    fi
done

echo "=================================================="
echo "==> Registration Complete. Verifying list..."
echo "=================================================="

# List all nodes to confirm
flwr supernode list "$FEDERATION"