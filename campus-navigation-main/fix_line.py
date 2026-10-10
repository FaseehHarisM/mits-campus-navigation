import os
import re

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = re.sub(
    r"<line key=\{e\.EdgeID\} geometry=\{lineGeo\}>\s*<lineBasicMaterial color=\"#d93025\" linewidth=\{5\} />\s*</line>",
    """<line 
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
                  </line>""",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced!")
