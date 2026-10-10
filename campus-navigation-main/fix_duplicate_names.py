import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Emergency sets destination to NodeID instead of Name
content = content.replace(
    "setDestination(nearestExit.Name);",
    "setDestination(nearestExit.NodeID);"
)

# Fix 2: Dropdown options use NodeID as their value so they map correctly to unique nodes
content = content.replace(
    "<option key={node.NodeID} value={node.Name}>",
    "<option key={node.NodeID} value={node.NodeID}>"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dropdown value fixed to use NodeID.")
