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
        encoding=serialization.Encoding.Raw,
        format=serialization. PublicFormat.Raw
    )
    
    # Convert to node ID (use full bytes as big-endian integer)
    # Truncate to 64-bit to match Flower's node ID range
    node_id = int. from_bytes(raw_bytes[: 8], byteorder='big', signed=False)
    
    return node_id


print("=" * 80)
print("NODE ID MAPPING")
print("=" * 80)

node_ids = {}

for i in [1, 2, 3, 4, 5]:
    pub_key_path = f"node{i}/node{i}.pub"
    
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