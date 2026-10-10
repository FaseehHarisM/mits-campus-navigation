import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the line rendering to include onClick
old_line = """                return (
                  <line key={e.EdgeID} geometry={lineGeo}>
                    <lineBasicMaterial color="#d93025" linewidth={5} />
                  </line>
                );"""

new_line = """                return (
                  <line 
                    key={e.EdgeID} 
                    geometry={lineGeo}
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (toolMode === 'Select') {
                        if (window.confirm('Delete this path?')) {
                          try {
                            await axios.delete(`/api/edges/${e._id}`);
                            fetchGraph();
                          } catch (err) { console.error(err); }
                        }
                      }
                    }}
                  >
                    <lineBasicMaterial color="#d93025" linewidth={5} />
                  </line>
                );"""

content = content.replace(old_line, new_line)

# Add a hint in the instructions for Delete Mode
content = content.replace(
    """<button onClick={() => {setToolMode('Select'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'Select' ? '#e8f0fe' : 'white', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'Select' ? 'bold' : 'normal' }}>Delete Mode</button>""",
    """<button onClick={() => {setToolMode('Select'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'Select' ? '#e8f0fe' : 'white', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'Select' ? 'bold' : 'normal' }}>Delete Mode</button>"""
)

# If we want to add an instruction line for Delete Mode:
content = content.replace(
    """{toolMode === 'AddNode' && <p style={{ margin: '8px 0 0 0', color: '#1e8e3e', fontSize: '14px' }}><strong>Instructions:</strong> Click anywhere on the floor to place a node.</p>}""",
    """{toolMode === 'Select' && <p style={{ margin: '8px 0 0 0', color: '#1a73e8', fontSize: '14px' }}><strong>Instructions:</strong> Click any Node or Path (Red Line) to delete it.</p>}\n          {toolMode === 'AddNode' && <p style={{ margin: '8px 0 0 0', color: '#1e8e3e', fontSize: '14px' }}><strong>Instructions:</strong> Click anywhere on the floor to place a node.</p>}"""
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Edge Deletion Feature Integrated")
