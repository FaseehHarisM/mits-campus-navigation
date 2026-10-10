import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
content = content.replace(
    "const [selectedNodeA, setSelectedNodeA] = useState(null);",
    "const [selectedNodeA, setSelectedNodeA] = useState(null);\n  const [undoStack, setUndoStack] = useState([]);"
)

# 2. Update Tool Mode reset to clear stack
content = re.sub(
    r"setToolMode\('([^']+)'\);\s*setSelectedNodeA\(null\);",
    r"setToolMode('\1'); setSelectedNodeA(null); setUndoStack([]);",
    content
)

# 3. Add Undo Function
undo_func = """
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.edge_id) await axios.delete(`/api/edges/${lastAction.edge_id}`);
      if (lastAction.node_id) await axios.delete(`/api/nodes/${lastAction.node_id}`);
      
      setUndoStack(prev => prev.slice(0, -1));
      setSelectedNodeA(lastAction.prevSelectedNode);
      fetchGraph();
    } catch (err) {
      alert("Undo failed.");
    }
  };
"""
content = content.replace("const handleMapClick = async (point) => {", undo_func + "\n  const handleMapClick = async (point) => {")

# 4. Update Map Click to save undo state
# We need to capture the response from axios.post
map_post_node_old = "await axios.post('/api/nodes', newNode);"
map_post_node_new = "const resNode = await axios.post('/api/nodes', newNode);"
content = content.replace(map_post_node_old, map_post_node_new)

map_post_edge_old = """          await axios.post('/api/edges', {
            EdgeID: 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
            StartNodeID: selectedNodeA.NodeID,
            EndNodeID: newNode.NodeID,
            Distance: dist,
            EdgeType: 'walkway'
          });
          
          setSelectedNodeA(newNode);"""

map_post_edge_new = """          const resEdge = await axios.post('/api/edges', {
            EdgeID: 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
            StartNodeID: selectedNodeA.NodeID,
            EndNodeID: newNode.NodeID,
            Distance: dist,
            EdgeType: 'walkway'
          });
          
          setUndoStack(prev => [...prev, {
            node_id: resNode.data._id,
            edge_id: resEdge.data._id,
            prevSelectedNode: selectedNodeA
          }]);
          
          setSelectedNodeA(resNode.data);"""
content = content.replace(map_post_edge_old, map_post_edge_new)

# 5. Update Node Click to save undo state
node_post_edge_old = """        try {
          await axios.post('/api/edges', newEdge);
          if (toolMode === 'DrawPath') {
            setSelectedNodeA(clickedNode);
          } else {
            setSelectedNodeA(null);
          }
          fetchGraph();"""

node_post_edge_new = """        try {
          const resEdge = await axios.post('/api/edges', newEdge);
          if (toolMode === 'DrawPath') {
            setUndoStack(prev => [...prev, {
              node_id: null,
              edge_id: resEdge.data._id,
              prevSelectedNode: selectedNodeA
            }]);
            setSelectedNodeA(clickedNode);
          } else {
            setSelectedNodeA(null);
          }
          fetchGraph();"""
content = content.replace(node_post_edge_old, node_post_edge_new)


# 6. Add the Undo Button in the UI
old_draw_instructions = "Click the floor to drop waypoints around corners. Click a Room to link it. Click ${selectedNodeA.Name} again to stop drawing.` : 'Click any starting Room to begin drawing a path.'}</p>}"

new_draw_instructions = """Click the floor to drop waypoints around corners. Click a Room to link it. Click ${selectedNodeA.Name} again to stop drawing.` : 'Click any starting Room to begin drawing a path.'}
            {undoStack.length > 0 && (
              <button onClick={handleUndo} style={{ marginLeft: '16px', padding: '4px 12px', background: '#fce8e6', border: '1px solid #d93025', color: '#d93025', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                ↩ Undo Last Point
              </button>
            )}
          </p>}"""

content = content.replace(old_draw_instructions, new_draw_instructions)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Undo Feature Integrated")
