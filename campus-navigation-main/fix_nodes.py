import os
import re

filepath = os.path.join('src', 'pages', 'AdminNodes.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'const filteredList' not in content:
    replacement = """  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ NodeID: '', Name: '', Type: 'Room', Floor: '0', X: '', Y: '' });
  };

  const filteredList = nodeList.filter(item => 
    (item.Name && item.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.NodeID && item.NodeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.Type && item.Type.toLowerCase().includes(searchTerm.toLowerCase()))
  );"""
    
    # We replace the cancelEdit block with cancelEdit + filteredList
    content = re.sub(r'  const cancelEdit = \(\) => \{\n.*?setEditingId\(null\);\n.*?setFormData\(.*?\);\n  \};', replacement, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed AdminNodes")
