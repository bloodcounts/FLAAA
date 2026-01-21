#!/bin/bash

# Generate keys for 2 nodes
for i in 1 2; do
    mkdir -p "node${i}"
    
    # Generate ED25519 key pair
    openssl genpkey -algorithm ED25519 -out "node${i}/node${i}. pem"
    openssl pkey -in "node${i}/node${i}.pem" -pubout -out "node${i}/node${i}.pub"
    
    echo "✓ Generated keys for Node ${i}"
done

echo ""
echo "Keys generated!  Now run:  python get_node_ids.py"