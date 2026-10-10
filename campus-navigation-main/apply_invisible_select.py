import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The regex should capture from <select to </select>
old_select_regex = r"<select\s+value=\{activeBuilding\}[\s\S]*?</select>"

new_select = """<div style={{ position: 'relative', width: '45px', height: '45px', marginBottom: '8px' }}>
            <button style={{ 
                width: '100%', height: '100%', background: 'white', color: '#5f6368', 
                border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span className="material-symbols-outlined">apartment</span>
            </button>
            <select 
              value={activeBuilding} 
              onChange={(e) => {
                setActiveBuilding(e.target.value);
                setActiveFloor('0'); // Reset to default when switching
              }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            >
              {Object.values(CAMPUS_BUILDINGS).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>"""

content = re.sub(old_select_regex, new_select, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Invisible Select Wrapper")
