import os

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the CSS height collapse
content = content.replace(
    "<div style={{ flex: 1, position: 'relative', background: '#E8EAED' }}>", 
    "<div style={{ height: 'calc(100vh - 120px)', minHeight: '600px', position: 'relative', background: '#E8EAED', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>"
)

# And remove the height: 100% on the main container which might also be causing issues
content = content.replace(
    "<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>",
    "<div style={{ display: 'flex', flexDirection: 'column' }}>"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
