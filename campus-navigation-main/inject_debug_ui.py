import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

debug_ui = """
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 9999, background: 'red', color: 'white', padding: '10px', fontSize: '20px', fontWeight: 'bold' }}>
        DEBUG: Nodes = {nodesData.length} | Floor = {activeFloor}
      </div>
"""

content = content.replace("<div className=\"navigate-container\">", "<div className=\"navigate-container\">" + debug_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Debug UI")
