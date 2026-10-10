import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove shadows from Canvas and cap DPR
content = content.replace('<Canvas camera={{ position: [0, 2000, 2000], fov: 35, near: 1, far: 50000 }} shadows>', '<Canvas camera={{ position: [0, 2000, 2000], fov: 35, near: 1, far: 50000 }} dpr={[1, 1.5]}>')

# 2. Remove castShadow and shadow-mapSize from directionalLight
content = re.sub(r'<directionalLight position=\{\[1000, 3000, 1000\]\} intensity=\{1\.5\} color="#fffcf5" castShadow\s+shadow-mapSize-width=\{2048\}\s+shadow-mapSize-height=\{2048\}\s+\/>', '<directionalLight position={[1000, 3000, 1000]} intensity={1.5} color="#fffcf5" />', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Disabled WebGL Shadows and capped DPR")
