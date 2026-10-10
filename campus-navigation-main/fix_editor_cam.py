import os

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the camera starting position
content = content.replace(
    "<Canvas camera={{ position: [0, 8000, 4000], fov: 45, near: 10, far: 50000 }}>",
    "<Canvas camera={{ position: [4000, 15000, 4000], fov: 45, near: 10, far: 50000 }}>"
)

# Fix the OrbitControls target to look at the building, not the empty origin
content = content.replace(
    "target={[0, Y_OFFSETS[activeFloor], 0]}",
    "target={[4000, Y_OFFSETS[activeFloor], 1600]}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
