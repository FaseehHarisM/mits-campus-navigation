import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "edges.forEach(e => {" in line:
        lines[i+1] = "            if (g[e.StartNodeID] && g[e.EndNodeID]) {\n"
        lines.insert(i+2, "              g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };\n")
        lines.insert(i+3, "              g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };\n")
        lines.insert(i+4, "            }\n")
        # remove old lines
        del lines[i+5]
        del lines[i+5]
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Properly fixed orphan edges!")
