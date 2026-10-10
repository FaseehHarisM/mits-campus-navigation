import os

# 1. Append CSS class to index.css
css_path = os.path.join('src', 'index.css')
with open(css_path, 'a', encoding='utf-8') as f:
    f.write('\n\n/* Admin Map Editor Overlay Fix */\n.no-pointer-events { pointer-events: none !important; }\n.no-pointer-events * { pointer-events: none !important; }\n')

# 2. Update AdminMapEditor.jsx
editor_path = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(editor_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Increase node floating height from 50 to 120 so it is NEVER occluded by the floor
content = content.replace("position={[n.X + OFFSET_X, (Y_OFFSETS[activeFloor] || 0) + 50, n.Y + OFFSET_Z]}", 
                          "position={[n.X + OFFSET_X, (Y_OFFSETS[activeFloor] || 0) + 120, n.Y + OFFSET_Z]}")

# Increase sphere radius from 40 to 100 for a massive hit box
content = content.replace("sphereGeometry args={[40, 16, 16]}", 
                          "sphereGeometry args={[100, 16, 16]}")

# Add wrapperClass to Html to completely disable DOM pointer blocking
content = content.replace("<Html position={[0, 80, 0]} center style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.9)'", 
                          "<Html wrapperClass=\"no-pointer-events\" position={[0, 150, 0]} center style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.9)'")

# Increase raycaster threshold globally on the Canvas
content = content.replace("<Canvas camera={{ position: [0, 8000, 2000], fov: 45, near: 10, far: 50000 }}>",
                          "<Canvas raycaster={{ params: { Points: { threshold: 100 }, Line: { threshold: 100 }, Mesh: { threshold: 100 } } }} camera={{ position: [0, 8000, 2000], fov: 45, near: 10, far: 50000 }}>")

with open(editor_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Nodes made larger, floated higher, and HTML pointer events completely killed.")
