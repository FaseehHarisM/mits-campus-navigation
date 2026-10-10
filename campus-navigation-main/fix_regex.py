import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all flex-column HTML labels with the absolute positioning logic!
def replacer(match):
    return """<div style={{
                position: 'relative', width: '28px', height: '28px',
                animation: 'fadeIn 0.5s ease-out'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)', border: '2px solid white',
                  position: 'relative', zIndex: 2
                }}>
                  <span className="material-symbols-outlined filled" style={{ color: 'white', fontSize: '16px' }}>
                    {icon}
                  </span>
                </div>
                
                <div style={{
                  position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '4px 8px', borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)',
                  zIndex: 1
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3c4043', whiteSpace: 'nowrap' }}>
                    {n.Name}
                  </span>
                </div>
              </div>"""

# Match the entire <div>...</div> that is inside <Html ...>
content = re.sub(r'<div style=\{\{\s*display: \'flex\', flexDirection: \'column\'.*?\{n\.Name\}\s*<\/span>\s*<\/div>\s*<\/div>', replacer, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace executed")
