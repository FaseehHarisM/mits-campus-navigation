import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_edge = """          edges.forEach(e => {
            g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
            g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
          });"""

new_edge = """          edges.forEach(e => {
            if (g[e.StartNodeID] && g[e.EndNodeID]) {
              g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
              g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
            }
          });"""

content = content.replace(old_edge, new_edge)

# Remove the red error UI as it served its purpose
ui_error = """        {fetchError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '20px', zIndex: 9999, borderRadius: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            API ERROR: {fetchError}
          </div>
        )}"""
content = content.replace(ui_error, "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Orphan edges bug fixed")
