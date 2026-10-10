import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "<Html key={idx} position={pos} center  style={{ pointerEvents: 'none', display: 'block' }}>",
    "<Html key={idx} position={pos} center wrapperClass=\"map-label-wrapper\" style={{ pointerEvents: 'none' }}>"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Html style")
