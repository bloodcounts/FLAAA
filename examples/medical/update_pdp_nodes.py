#!/usr/bin/env python3
"""Update PDP nodes.json with generated node IDs."""

import json
import sys
from pathlib import Path

def update_pdp_nodes(node_ids_file: str, pdp_nodes_file: str, task_name: str = "medical"):
    """Update PDP nodes.json with generated node IDs."""

    # Load generated node IDs
    with open(node_ids_file, 'r') as f:
        node_ids_data = json.load(f)

    # Load existing PDP nodes
    pdp_nodes_path = Path(pdp_nodes_file)
    if pdp_nodes_path.exists():
        with open(pdp_nodes_path, 'r') as f:
            pdp_data = json.load(f)
    else:
        pdp_data = {"tasks": {}}

    # Ensure task exists
    if task_name not in pdp_data["tasks"]:
        pdp_data["tasks"][task_name] = {
            "task_expires": "2027-12-31T23:59:59Z",
            "task_membership_expires": "2027-12-31T23:59:59Z",
            "nodes": {}
        }

    task = pdp_data["tasks"][task_name]

    # Add/update nodes
    for node_num, node_id in node_ids_data.items():
        node_id_str = str(node_id)
        if node_id_str not in task["nodes"]:
            task["nodes"][node_id_str] = {
                "is_member_of_task": True,
                "task_membership_expires": "2027-12-31T23:59:59Z",
                "task_role": "participant"
            }
            print(f"✓ Added Node {node_num} (ID: {node_id}) to {task_name} task")
        else:
            print(f"✓ Node {node_num} (ID: {node_id}) already exists in {task_name} task")

    # Save updated PDP nodes
    with open(pdp_nodes_path, 'w') as f:
        json.dump(pdp_data, f, indent=2)

    print(f"✓ Updated {pdp_nodes_file} with {len(node_ids_data)} nodes")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update_pdp_nodes.py <node_ids.json> <pdp_nodes.json>")
        sys.exit(1)

    node_ids_file = sys.argv[1]
    pdp_nodes_file = sys.argv[2]

    update_pdp_nodes(node_ids_file, pdp_nodes_file)