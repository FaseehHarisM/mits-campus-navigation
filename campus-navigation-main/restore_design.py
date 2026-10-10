import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restore the original beautiful HTML labels
bad_html_regex = re.compile(
    r"<group key=\{idx\}>\s*<mesh position=\{pos\}>\s*<sphereGeometry args=\{\[25, 16, 16\]\} />\s*<meshBasicMaterial color=\{color\} />\s*<Html position=\{\[0, 30, 0\]\} center style=\{\{ pointerEvents: 'none' \}\}>\s*<div style=\{\{.*?\}\}>\s*\{n\.Name\}\s*</div>\s*</Html>\s*</mesh>\s*</group>",
    re.DOTALL
)

original_design = """          return (
            <Html key={idx} position={pos} center  style={{ pointerEvents: 'none', display: 'block' }}>
              <div style={{
                  position: 'relative', width: '28px', height: '28px',
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
              </div>
            </Html>
          );"""

content = bad_html_regex.sub(original_design, content)


# 2. Remove the debug counters and error boxes
debug_counter = """        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 9999, background: '#0F9D58', color: 'white', padding: '16px', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          NODES LOADED: {nodesData.length}
        </div>
"""

ui_error = """        {fetchError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '20px', zIndex: 9999, borderRadius: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            NEW API ERROR: {fetchError}
          </div>
        )}"""

content = content.replace(debug_counter, "")
content = content.replace(ui_error, "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored original design and removed debug UI")
