import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Increase Y height from 30 to 150
content = content.replace("const pos = svgToWorld(n.X, n.Y, 30, String(n.Floor));", "const pos = svgToWorld(n.X, n.Y, 150, String(n.Floor));")

# Remove zIndexRange to disable 3D occlusion sorting (let CSS paint over everything)
content = content.replace("zIndexRange={[0, 0]}", "")

# Same for active path markers
content = content.replace("svgToWorld(n.X, n.Y, 80, String(n.Floor))", "svgToWorld(n.X, n.Y, 160, String(n.Floor))")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Label Elevation Updated")
