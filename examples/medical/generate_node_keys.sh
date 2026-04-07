#!/bin/bash

# Generate keys for 5 nodes (matching the registration script)
for i in 1 2 3 4 5; do
    mkdir -p "/app/.flwr/node${i}"
    
    # Generate SECP384R1 key pair (NIST standard curve required by Flower)
    openssl ecparam -genkey -name secp384r1 -noout -out "/app/.flwr/node${i}/node${i}.pem"
    openssl ec -in "/app/.flwr/node${i}/node${i}.pem" -pubout -out "/app/.flwr/node${i}/node${i}.pem.pub"
    
    # Convert PEM public key to SSH format for Flower
    ssh-keygen -i -m PKCS8 -f "/app/.flwr/node${i}/node${i}.pem.pub" > "/app/.flwr/node${i}/node${i}.pub"
    
    echo "✓ Generated SECP384R1 keys for Node ${i}"
done

echo ""
echo "Keys generated!  Now run:  python get_node_ids.py"