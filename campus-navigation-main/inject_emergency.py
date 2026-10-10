import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Avoid Stairs label with a wrapped div containing both buttons
target_label = r'<label style=\{\{ display: \'flex\', alignItems: \'center\', gap: \'8px\', fontSize: \'0\.85rem\', color: \'#1967d2\', background: \'#e8f0fe\', padding: \'4px 10px\', borderRadius: \'12px\', cursor: \'pointer\' \}\}>'

new_buttons = """<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={handleEmergency} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'white', background: '#d93025', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span>
                  Emergency
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1967d2', background: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>"""

content = re.sub(target_label, new_buttons, content)

# We also need to close the extra div after the Avoid Stairs label closes
target_close = r'Avoid Stairs\s*</label>'
new_close = """Avoid Stairs
                </label>
              </div>"""

content = re.sub(target_close, new_close, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Emergency UI injected successfully.")
