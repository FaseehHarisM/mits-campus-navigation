import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

debug_counter = """        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 9999, background: '#0F9D58', color: 'white', padding: '16px', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          NODES LOADED: {nodesData.length}
        </div>"""

ui_error = """        {fetchError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '20px', zIndex: 9999, borderRadius: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            NEW API ERROR: {fetchError}
          </div>
        )}"""

content = content.replace(debug_counter, debug_counter + "\n" + ui_error)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Re-injected Error UI")
