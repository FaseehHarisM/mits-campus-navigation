import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_container = "display: 'flex', \nflexDirection: 'column', gap: '8px', zIndex: 99999999 }}"
new_container = "display: 'flex', \nflexDirection: 'column', alignItems: 'flex-end', gap: '8px', zIndex: 99999999 }}"
content = content.replace(old_container, new_container)

old_select = "style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontWeight: 'bold', marginBottom: \n'8px', background: 'white', color: '#5f6368', cursor: 'pointer' }}"
new_select = "style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', fontWeight: 'bold', marginBottom: \n'8px', background: 'white', color: '#5f6368', cursor: 'pointer', fontSize: '0.8rem', maxWidth: '120px' }}"
content = content.replace(old_select, new_select)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Floor Switcher Alignment")
