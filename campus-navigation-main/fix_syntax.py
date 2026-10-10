import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "if (g[e.StartNodeID] && g[e.EndNodeID]) {" in line:
        lines.insert(i+4, "          });\n")
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed Syntax")
