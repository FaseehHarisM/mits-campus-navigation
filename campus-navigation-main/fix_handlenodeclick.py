import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find exactly where handleNodeClick is defined
start_idx = content.find("const handleNodeClick = async (e, clickedNode) => {")
end_idx = content.find("if (toolMode === 'Delete') {", start_idx)

if start_idx != -1 and end_idx != -1:
    old_code = content[start_idx:end_idx]
    new_code = """const handleNodeClick = async (e, clickedNode) => {
    e.stopPropagation();
    if (toolMode === 'AddEdge' || toolMode === 'DrawPath') {
      if (!selectedNodeA) {
        setSelectedNodeA(clickedNode);
      } else {
        if (selectedNodeA.NodeID === clickedNode.NodeID) {
          setSelectedNodeA(null);
          return;
        }
        const dx = selectedNodeA.X - clickedNode.X;
        const dy = selectedNodeA.Y - clickedNode.Y;
        const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
        
        const newEdge = {
          EdgeID: `E${Date.now().toString().slice(-6)}${Math.floor(Math.random()*100)}`,
          StartNodeID: selectedNodeA.NodeID,
          EndNodeID: clickedNode.NodeID,
          Distance: dist,
          EdgeType: 'walkway'
        };

        try {
          await axios.post('/api/edges', newEdge);
          if (toolMode === 'DrawPath') {
             setSelectedNodeA(clickedNode);
          } else {
             setSelectedNodeA(null);
          }
          fetchGraph();
        } catch (err) { alert("Failed to link nodes"); }
      }
      return;
    }
    """
    content = content[:start_idx] + new_code + content[end_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed handleNodeClick!")
else:
    print("Could not find boundaries.")
