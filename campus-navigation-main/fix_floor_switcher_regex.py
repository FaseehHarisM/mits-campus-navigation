import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Floor Switcher Container
old_container_regex = r"flexDirection:\s*'column',\s*gap:\s*'8px',\s*zIndex:\s*99999999"
new_container = "flexDirection: 'column', alignItems: 'flex-end', gap: '8px', zIndex: 99999999"
content = re.sub(old_container_regex, new_container, content)

# 2. Fix Select Dropdown
old_select_regex = r"style=\{\{\s*padding:\s*'8px',\s*borderRadius:\s*'8px',\s*border:\s*'1px solid #ddd',\s*fontWeight:\s*'bold',\s*marginBottom:\s*'8px',\s*background:\s*'white',\s*color:\s*'#5f6368',\s*cursor:\s*'pointer'\s*\}\}"
new_select = "style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontWeight: 'bold', marginBottom: '8px', background: 'white', color: '#5f6368', cursor: 'pointer', fontSize: '0.8rem', maxWidth: '120px' }}"
content = re.sub(old_select_regex, new_select, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Flexbox Fix with Regex")
