import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

debug_counter = """
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 9999, background: '#0F9D58', color: 'white', padding: '16px', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          NODES LOADED: {nodesData.length}
        </div>
"""

content = content.replace("<div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>", "<div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>\n" + debug_counter)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected UI Counter")
