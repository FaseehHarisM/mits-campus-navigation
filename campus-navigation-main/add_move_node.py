import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Move Node button
btn_old = "<button onClick={() => {setToolMode('AddEdge'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'AddEdge' ? '#fce8e6' : 'white', border: '1px solid #d93025', color: '#d93025', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddEdge' ? 'bold' : 'normal' }}>Link Nodes</button>"
btn_new = """<button onClick={() => {setToolMode('AddEdge'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'AddEdge' ? '#fce8e6' : 'white', border: '1px solid #d93025', color: '#d93025', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddEdge' ? 'bold' : 'normal' }}>Link Nodes</button>
            <button onClick={() => {setToolMode('MoveMode'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'MoveMode' ? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#fbbc04', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'MoveMode' ? 'bold' : 'normal' }}>Move Node</button>"""
content = content.replace(btn_old, btn_new)

# Add instructions
inst_old = "{toolMode === 'AddEdge' && <p style={{ margin: '8px 0 0 0', color: '#d93025', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click a second node to link to ${selectedNodeA.Name}` : 'Click the first node to start linking'}</p>}"
inst_new = """{toolMode === 'AddEdge' && <p style={{ margin: '8px 0 0 0', color: '#d93025', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click a second node to link to ${selectedNodeA.Name}` : 'Click the first node to start linking'}</p>}
        {toolMode === 'MoveMode' && <p style={{ margin: '8px 0 0 0', color: '#fbbc04', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click anywhere on the floor to drop ${selectedNodeA.Name} at the new location.` : 'Click a node you want to move.'}</p>}"""
content = content.replace(inst_old, inst_new)

# Handle Node Click for MoveMode
node_click_old = """} else if (toolMode === 'Select') {"""
node_click_new = """} else if (toolMode === 'MoveMode') {
      if (!selectedNodeA) {
        setSelectedNodeA(clickedNode);
      }
    } else if (toolMode === 'Select') {"""
content = content.replace(node_click_old, node_click_new)

# Handle Floor Click for MoveMode
floor_click_old = """if (toolMode === 'AddNode') {"""
floor_click_new = """if (toolMode === 'MoveMode' && selectedNodeA) {
      const svgX = Math.round(point.x - OFFSET_X);
      const svgY = Math.round(point.z - OFFSET_Z);
      try {
        await axios.put(`/api/nodes/${selectedNodeA._id}`, { ...selectedNodeA, X: svgX, Y: svgY });
        setSelectedNodeA(null);
        fetchGraph();
      } catch (err) { alert("Failed to move node."); }
      return;
    }
    if (toolMode === 'AddNode') {"""
content = content.replace(floor_click_old, floor_click_new)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
