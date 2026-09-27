import os
import re

files = ['AdminEdges.jsx', 'AdminQR.jsx', 'AdminFloors.jsx', 'AdminEvents.jsx', 'AdminFaculty.jsx']

for file in files:
    filepath = os.path.join('src', 'pages', file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'setEditingId' in content:
        continue
        
    # 1. State
    content = re.sub(r'(const \[deleteModalId, setDeleteModalId\] = useState\(null\);)', r'\1\n  const [editingId, setEditingId] = useState(null);', content)
    
    # 2. Extract initial state & API route
    init_state_match = re.search(r'const \[formData, setFormData\] = useState\((.*?)\);', content)
    init_state = init_state_match.group(1) if init_state_match else '{}'
    
    api_path_match = re.search(r'axios\.post\(\'\/api\/(.*?)\'', content)
    if not api_path_match:
        api_path_match = re.search(r'api\.post\(\'\/api\/(.*?)\'', content)
    api_path = api_path_match.group(1) if api_path_match else ''
    
    # 3. New HandleSubmit & Edit funcs
    edit_funcs = f"""
  const handleEdit = (item) => {{
    setEditingId(item._id);
    const formPayload = {{ ...item }};
    delete formPayload._id;
    delete formPayload.__v;
    setFormData(formPayload);
  }};

  const cancelEdit = () => {{
    setEditingId(null);
    setFormData({init_state});
  }};
"""

    # Replace handleSubmit
    def replace_submit(match):
        inner = match.group(0)
        fetch_call = re.search(r'(fetch[a-zA-Z0-9_]+\(\);)', inner)
        fetch_str = fetch_call.group(1) if fetch_call else ''
        
        api_var = 'api' if 'api.post' in inner else 'axios'
        
        return f"""const handleSubmit = async (e) => {{
    e.preventDefault();
    try {{
      if (editingId) {{
        await {api_var}.put(`/api/{api_path}/${{editingId}}`, formData);
      }} else {{
        await {api_var}.post('/api/{api_path}', formData);
      }}
      setEditingId(null);
      setFormData({init_state});
      {fetch_str}
    }} catch (err) {{
      console.error(err);
    }}
  }};"""

    content = re.sub(r'const handleSubmit = async \(e\) => \{[\s\S]*?\n  \};', replace_submit, content)
    
    content = content.replace('const handleDelete', edit_funcs + '\n  const handleDelete')
    
    # 4. Form modifications
    content = re.sub(r'<h3(.*?)>Add New (.*?)<\/h3>', r'<h3\1>{editingId ? "Edit \2" : "Add New \2"}</h3>', content)
    
    def replace_buttons(match):
        style = match.group(1)
        name = match.group(2)
        return f"""<div style={{{{ display: 'flex', gap: '8px' }}}}>
              {{editingId && <button type="button" onClick={{cancelEdit}} style={{{{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}}}>Cancel</button>}}
              <button type="submit" style={style}>{{editingId ? 'Update {name}' : 'Add {name}'}}</button>
            </div>"""
            
    content = re.sub(r'<button type="submit" style={(.*?)}>Add (.*?)<\/button>', replace_buttons, content)
    
    # 5. Table buttons
    def replace_table_btn(match):
        var_name = match.group(1)
        return f"""<div style={{{{ display: 'flex', gap: '8px' }}}}>
                          <button onClick={{() => handleEdit({var_name})}} style={{{{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}}}>
                            <span className="material-symbols-outlined" style={{{{ fontSize: '18px' }}}}>edit</span> Edit
                          </button>
                          <button onClick={{() => setDeleteModalId({var_name}._id)"""
                          
    content = re.sub(r'<button onClick=\{\(\) => setDeleteModalId\((.*?)\._id\)', replace_table_btn, content)
    
    # Fix the closing div for the table buttons
    content = re.sub(r'Delete<\/button><\/td>', r'Delete</button>\n                        </div>\n                      </td>', content)
    content = re.sub(r'Delete<\/button>\n\s*<\/td>', r'Delete</button>\n                        </div>\n                      </td>', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
