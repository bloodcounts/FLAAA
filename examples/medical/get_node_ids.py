"""Get node IDs from generated public keys."""

from cryptography.hazmat.primitives import serialization
from pathlib import Path
import hashlib

def get_node_id(public_key_path: str) -> int:
    """Get consistent node ID from public key."""
    
    # Read public key
    pub_key_bytes = Path(public_key_path).read_bytes()
    
    # Parse PEM format
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    
    public_key = load_pem_public_key(pub_key_bytes, backend=default_backend())
    
    # Get raw public key bytes
    raw_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    
    # Convert to node ID (hash the public key and take first 8 bytes as big-endian integer)
    # This matches Flower's approach of deriving deterministic IDs from public keys
    import hashlib
    key_hash = hashlib.sha256(raw_bytes).digest()
    node_id = int.from_bytes(key_hash[:8], byteorder='big', signed=False)
    
    return node_id


print("=" * 80)
print("NODE ID MAPPING")
print("=" * 80)

node_ids = {}

for i in [1, 2, 3, 4, 5]:
    pub_key_path = f"/app/.flwr/node{i}/node{i}.pem.pub"
    
    if Path(pub_key_path).exists():
        node_id = get_node_id(pub_key_path)
        node_ids[i] = node_id
        print(f"Node {i}: {node_id}")
    else:
        print(f"❌ Node {i}: Key not found at {pub_key_path}")

print("=" * 80)
print("\nAdd these to policies/node_registry.yaml:")
print("")

for i, node_id in node_ids.items():
    print(f"  {node_id}:")
    print(f"    organization: \"Node {i}\"")
    print(f"    tier: \"premium\"")
    print(f"    # ...  other config ...")
    print("")

# Save node IDs to JSON file for automation
import json
with open('/pdp-sample-data/node_ids.json', 'w') as f:
    json.dump(node_ids, f, indent=2)

print(f"✓ Saved {len(node_ids)} node IDs to /pdp-sample-data/node_ids.json")
print("=" * 80)