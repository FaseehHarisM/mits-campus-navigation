const fs = require('fs');
const path = require('path');

const files = [
  'AdminEdges.jsx', 'AdminQR.jsx', 
  'AdminFloors.jsx', 'AdminEvents.jsx', 'AdminFaculty.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has editingId
  if (content.includes('const [editingId, setEditingId] = useState(null);')) {
    console.log(`Skipping ${file}, already has edit functionality`);
    return;
  }
  
  // 1. Add editingId state
  content = content.replace(/(const \[formData, setFormData\] = useState\((.*?)\);)/, `$1\n  const [editingId, setEditingId] = useState(null);`);
  const matchFormData = content.match(/const \[formData, setFormData\] = useState\((.*?)\);/);
  const initialState = matchFormData ? matchFormData[1] : '{}';
  
  // 2. Add handleEdit and cancelEdit
  // We need to know the variable name used in the map loop to populate formData properly. 
  // It's usually the singular of the API endpoint or list name, but we can just use `item` and pass it in.
  const apiPathMatch = content.match(/axios\.post\(['"]\/api\/(.*?)['"]/);
  const apiPath = apiPathMatch ? apiPathMatch[1] : '';
  
  const editFunctions = `
  const handleEdit = (item) => {
    setEditingId(item._id);
    const formPayload = { ...item };
    delete formPayload._id;
    delete formPayload.__v;
    setFormData(formPayload);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(${initialState});
  };
  `;
  
  content = content.replace(/const handleDelete/g, `${editFunctions}\n  const handleDelete`);
  
  // 3. Update handleSubmit
  const submitRegex = /const handleSubmit = async \(e\) => \{[\s\S]*?e\.preventDefault\(\);([\s\S]*?)setFormData\((.*?)\);([\s\S]*?)\};/;
  
  const newSubmit = `const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (typeof api !== 'undefined' ? api : axios).put(\`/api/${apiPath}/\${editingId}\`, formData);
      } else {
        await (typeof api !== 'undefined' ? api : axios).post(\`/api/${apiPath}\`, formData);
      }
      setEditingId(null);
      setFormData(${initialState});
      // Try to call the fetch function dynamically, usually fetchXYZ()
      const fetchMatch = content.match(/fetch[A-Z][a-zA-Z0-9_]*\(\);/g);
      // Wait, we can just keep the original fetch lines
      // Let's rewrite the replacement to be safer
    } catch (err) { console.error(err); }
  };`;
  
  // Actually, rewriting handleSubmit safely:
  content = content.replace(/const handleSubmit = async \(e\) => \{[\s\S]*?e\.preventDefault\(\);([\s\S]*?)setFormData\(.*?\);([\s\S]*?)\};/, (match, postCall, fetchCall) => {
    return `const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (typeof api !== 'undefined' ? api : axios).put(\`/api/${apiPath}/\${editingId}\`, formData);
      } else {
        await (typeof api !== 'undefined' ? api : axios).post(\`/api/${apiPath}\`, formData);
      }
      setEditingId(null);
      setFormData(${initialState});
${fetchCall}
    } catch (err) { console.error(err); }
  };`;
  });
  
  // 4. Update the form Title
  content = content.replace(/<h3(.*?)>Add New (.*?)<\/h3>/, `<h3$1>{editingId ? 'Edit $2' : 'Add New $2'}</h3>`);
  
  // 5. Update the submit button & add cancel
  content = content.replace(/<button type="submit"(.*?)>Add (.*?)<\/button>/, `<div style={{ display: 'flex', gap: '8px' }}>
    {editingId && <button type="button" onClick={cancelEdit} style={{...$1.match(/style=\{(.*?)\}/)[1], background: '#f1f3f4', color: '#3c4043', border: '1px solid #dadce0'}}>Cancel</button>}
    <button type="submit"$1>{editingId ? 'Update $2' : 'Add $2'}</button>
  </div>`);
  // If the previous regex failed because style match is tricky, let's just do a simpler replacement:
  content = content.replace(/<button type="submit" style=\{([^}]*?)\}>Add (.*?)<\/button>/, `<div style={{ display: 'flex', gap: '8px' }}>
    {editingId && <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }}>Cancel</button>}
    <button type="submit" style={$1}>{editingId ? 'Update $2' : 'Add $2'}</button>
  </div>`);
  
  // 6. Add Edit button to table row
  const editBtnStyle = `{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }`;
  
  // We need to inject the Edit button next to Delete.
  // Look for: <button onClick={() => setDeleteModalId(VAR._id)}
  // We will capture the variable name!
  content = content.replace(/<button onClick=\{\(\) => setDeleteModalId\((.*?)\._id\)\}/g, `<button onClick={() => handleEdit($1)} style=${editBtnStyle}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit</button>\n                        <button onClick={() => setDeleteModalId($1._id)}`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
