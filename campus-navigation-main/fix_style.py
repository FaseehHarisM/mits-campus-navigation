import os
import re

files = ['AdminEdges.jsx', 'AdminQR.jsx', 'AdminFloors.jsx', 'AdminEvents.jsx', 'AdminFaculty.jsx']

for file in files:
    filepath = os.path.join('src', 'pages', file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('style=btnStyle', 'style={{btnStyle}}')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
