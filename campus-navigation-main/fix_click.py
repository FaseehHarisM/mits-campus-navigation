import os

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Change onPointerDown to onClick for the click catcher plane
content = content.replace(
    "onPointerDown={(e) => {",
    "onClick={(e) => {"
)

# Change onPointerDown to onClick for the node meshes
content = content.replace(
    "onPointerDown={(e) => handleNodeClick(e, n)}",
    "onClick={(e) => handleNodeClick(e, n)}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
