import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_put = "await axios.put(`/api/nodes/${selectedNodeA._id}`, { ...selectedNodeA, X: svgX, Y: svgY });"
new_put = """
        const payload = {
          NodeID: selectedNodeA.NodeID,
          Name: selectedNodeA.Name,
          Type: selectedNodeA.Type,
          Floor: selectedNodeA.Floor,
          X: svgX,
          Y: svgY
        };
        await axios.put(`/api/nodes/${selectedNodeA._id}`, payload);
"""

content = content.replace(old_put, new_put)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
