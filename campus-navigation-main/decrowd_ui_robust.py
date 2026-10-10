import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Using regex with wildcard to capture the whole block regardless of whitespace
old_regex = r"<div style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'16px'\s*\}\}>[\s\S]*?<h2 style=\{\{\s*fontSize:\s*'1\.2rem',\s*margin:\s*0,\s*color:\s*'#3c4043'\s*\}\}>Route Planner</h2>[\s\S]*?</div>\s*</div>"

new_header = """<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#3c4043', fontWeight: 800 }}>Route Planner</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={handleEmergency} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 'bold', color: 'white', background: '#EA4335', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', border: 'none', boxShadow: '0 2px 4px rgba(234, 67, 53, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emergency</span>
                Emergency
              </button>
              <label style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: '#1967d2', background: '#e8f0fe', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #d2e3fc' }}>
                <input type="checkbox" checked={isAccessible} onChange={(e) => setIsAccessible(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>accessible</span>
                Avoid Stairs
              </label>
            </div>"""

content = re.sub(old_regex, new_header, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Decrowded the Route Planner Header via robust Regex")
