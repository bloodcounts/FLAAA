#!/bin/bash

export GRPC_DEFAULT_SSL_ROOTS_FILE_PATH=/workspace/certificates/ca.crt
set -e

# Configuration
CERT_DIR="../certificates"
PROJECT_DIR="."
FEDERATION="cancer-detection"
NUM_CLIENTS=5

echo "=================================================="
echo "==> Registering $NUM_CLIENTS SuperNodes to '$FEDERATION'"
echo "=================================================="

for i in $(seq 1 $NUM_CLIENTS); do
    # Define the key path (matches the keys you generated earlier)
    KEY_FILE="$CERT_DIR/client${i}_auth_key.pub"

    if [ -f "$KEY_FILE" ]; then
        echo -n "   -> Client $i: "
        # Run the registration command
        flwr supernode register "$KEY_FILE" "$PROJECT_DIR" "$FEDERATION"
    else
        echo "   ❌ Warning: Public key for Client $i not found at $KEY_FILE"
    fi
done

echo "=================================================="
echo "==> Registration Complete. Verifying list..."
echo "=================================================="

# List all nodes to confirm
flwr supernode list "$PROJECT_DIR" "$FEDERATION"