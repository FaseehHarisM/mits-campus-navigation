import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_regex = r"<div style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'12px'\s*\}\}>[\s\S]*?</label>\s*</div>"

new_header = """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#3c4043', fontWeight: 800 }}>Route Planner</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <button onClick={handleEmergency} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'white', background: '#EA4335', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', border: 'none', boxShadow: '0 2px 4px rgba(234, 67, 53, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span>
                Emergency
              </button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#1967d2', background: '#e8f0fe', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #d2e3fc' }}>
                <input type="checkbox" checked={isAccessible} onChange={(e) => setIsAccessible(e.target.checked)} style={{ cursor: 'pointer', margin: 0 }} />
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span>
                Avoid Stairs
              </label>
            </div>"""

content = re.sub(old_regex, new_header, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Compacted the Route Planner Header")
