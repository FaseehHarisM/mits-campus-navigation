import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the UI button for Draw Path
old_buttons = r"<button onClick=\{\(\) => \{setToolMode\('MoveMode'\); setSelectedNodeA\(null\);\}\} style=\{\{ padding: '8px 16px', background: toolMode === 'MoveMode' \? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#fbbc04', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'MoveMode' \? 'bold' : 'normal' \}\}>Move Node</button>"

new_buttons = """<button onClick={() => {setToolMode('MoveMode'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'MoveMode' ? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#fbbc04', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'MoveMode' ? 'bold' : 'normal' }}>Move Node</button>
            <button onClick={() => {setToolMode('DrawPath'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'DrawPath' ? '#f3e8fd' : 'white', border: '1px solid #9334e6', color: '#9334e6', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'DrawPath' ? 'bold' : 'normal' }}>✏️ Draw Path</button>"""

content = re.sub(old_buttons, new_buttons, content)

# 2. Add instructions for Draw Path
old_instructions = r"\{toolMode === 'MoveMode' && <p.*?Move Mode.*?</p>\}"
new_instructions = "{toolMode === 'MoveMode' && <p style={{ margin: '8px 0 0 0', color: '#fbbc04', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click anywhere on the floor to drop ${selectedNodeA.Name} at the new location.` : 'Click a node you want to move.'}</p>}\n          {toolMode === 'DrawPath' && <p style={{ margin: '8px 0 0 0', color: '#9334e6', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click on the floor to drop a waypoint, or click a Room to finish the path. Click ${selectedNodeA.Name} again to cancel.` : 'Click any starting Room or Node to begin drawing a path.'}</p>}"

# If regex for MoveMode fails, I'll just insert after it
content = content.replace(
    "{toolMode === 'MoveMode' && <p style={{ margin: '8px 0 0 0', color: '#fbbc04', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click anywhere on the floor to drop ${selectedNodeA.Name} at the new location.` : 'Click a node you want to move.'}</p>}",
    "{toolMode === 'MoveMode' && <p style={{ margin: '8px 0 0 0', color: '#fbbc04', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click anywhere on the floor to drop ${selectedNodeA.Name} at the new location.` : 'Click a node you want to move.'}</p>}\n          {toolMode === 'DrawPath' && <p style={{ margin: '8px 0 0 0', color: '#9334e6', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click the floor to drop waypoints around corners. Click a Room to link it. Click ${selectedNodeA.Name} again to stop drawing.` : 'Click any starting Room to begin drawing a path.'}</p>}"
)

# 3. Update handleMapClick
handleMapClick_injection = """
      if (toolMode === 'DrawPath') {
        if (!selectedNodeA) {
          alert("Please click an existing node first to start drawing a path from it.");
          return;
        }
        const svgX = Math.round(point.x - OFFSET_X);
        const svgY = Math.round(point.z - OFFSET_Z);
        try {
          const newNode = {
            NodeID: 'J' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
            Name: 'Junction',
            Type: 'Junction',
            Floor: activeFloor,
            X: svgX,
            Y: svgY
          };
          await axios.post('/api/nodes', newNode);
          
          const dx = selectedNodeA.X - svgX;
          const dy = selectedNodeA.Y - svgY;
          const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
          
          await axios.post('/api/edges', {
            EdgeID: 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
            StartNodeID: selectedNodeA.NodeID,
            EndNodeID: newNode.NodeID,
            Distance: dist,
            EdgeType: 'walkway'
          });
          
          setSelectedNodeA(newNode);
          fetchGraph();
        } catch (err) { alert("Failed to draw path point."); }
        return;
      }
"""
content = content.replace("if (toolMode === 'AddNode') {", handleMapClick_injection + "\n      if (toolMode === 'AddNode') {")

# 4. Update handleNodeClick
handleNodeClick_replacement = """
  const handleNodeClick = async (e, clickedNode) => {
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

content = re.sub(
    r"const handleNodeClick = async \(e, clickedNode\) => \{\s*e\.stopPropagation\(\);\s*if \(toolMode === 'AddEdge'\) \{.*?(?=if \(toolMode === 'Delete'\))",
    handleNodeClick_replacement,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Draw Path feature injected!")
