import os
import re

files = ['AdminFaculty.jsx', 'AdminEvents.jsx']

for file in files:
    filepath = os.path.join('src', 'pages', file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the multiline delete button and replace it with Edit + Delete
    # AdminFaculty has: setDeleteModalId(faculty._id)
    # AdminEvents has: setDeleteModalId(event._id)
    
    def replace_btn(match):
        var_name = match.group(1)
        return f"""<div style={{{{ display: 'flex', gap: '8px' }}}}>
                      <button onClick={{() => handleEdit({var_name})}} style={{{{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}}}>
                        <span className="material-symbols-outlined" style={{{{ fontSize: '18px' }}}}>edit</span> Edit
                      </button>
                      <button onClick={{() => setDeleteModalId({var_name}._id)}} style={{deleteBtnStyle}}>
                        <span className="material-symbols-outlined" style={{{{ fontSize: '18px' }}}}>delete</span> Delete
                      </button>
                    </div>"""
                    
    content = re.sub(r'<button onClick=\{\(\) => setDeleteModalId\((.*?)\._id\)\} style=\{deleteBtnStyle\}>\s*<span className="material-symbols-outlined" style=\{\{ fontSize: \'18px\' \}\}>delete<\/span> Delete\s*<\/button>', replace_btn, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed table buttons in {file}")
