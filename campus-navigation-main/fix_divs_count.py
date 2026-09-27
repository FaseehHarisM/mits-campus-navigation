import os
import re

files = ['AdminFaculty.jsx', 'AdminEvents.jsx', 'AdminEdges.jsx', 'AdminQR.jsx', 'AdminFloors.jsx']

for file in files:
    filepath = os.path.join('src', 'pages', file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We are missing a closing div BEFORE the DeleteModal
    # Let's just blindly insert </div> right before <DeleteModal
    # But wait, how many divs are unclosed?
    # Let's count them!
    
    open_divs = content.count('<div')
    close_divs = content.count('</div')
    
    diff = open_divs - close_divs
    print(f"{file} - Open: {open_divs}, Close: {close_divs}, Diff: {diff}")
    
    if diff > 0:
        content = content.replace('<DeleteModal', ('</div>\n        ' * diff) + '<DeleteModal')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")
