const fs = require('fs');
const path = require('path');

const configs = [
  { file: 'AdminEdges.jsx', itemName: 'Edge', init: "{ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' }", api: 'edges', fetch: 'fetchEdges()' },
  { file: 'AdminQR.jsx', itemName: 'QR Mapping', init: "{ QRID: '', NodeID: '' }", api: 'qr', fetch: 'fetchQRs()' },
  { file: 'AdminFloors.jsx', itemName: 'Floor', init: "{ FloorID: '', Label: '', Level: '' }", api: 'floors', fetch: 'fetchFloors()' },
  { file: 'AdminEvents.jsx', itemName: 'Event', init: "{ Title: '', Description: '', LocationNodeID: '', StartTime: '', EndTime: '' }", api: 'events', fetch: 'fetchEvents()' },
  { file: 'AdminFaculty.jsx', itemName: 'Faculty', init: "{ Name: '', Department: '', RoomNodeID: '', Phone: '', Email: '' }", api: 'faculty', fetch: 'fetchFaculty()' }
];

configs.forEach(cfg => {
  const filePath = path.join(__dirname, 'src', 'pages', cfg.file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('const [editingId, setEditingId] = useState(null);')) return;
  
  content = content.replace(/(const \[deleteModalId, setDeleteModalId\] = useState\(null\);)/, `$1\n  const [editingId, setEditingId] = useState(null);`);
  
  const editFns = `
  const handleEdit = (item) => {
    setEditingId(item._id);
    const payload = { ...item };
    delete payload._id;
    delete payload.__v;
    if (payload.StartTime) payload.StartTime = payload.StartTime.slice(0, 16);
    if (payload.EndTime) payload.EndTime = payload.EndTime.slice(0, 16);
    setFormData(payload);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(${cfg.init});
  };
`;
  
  content = content.replace(/const handleDelete = async/, `${editFns}\n  const handleDelete = async`);
  
  const submitFn = `const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (typeof api !== 'undefined' ? api : axios).put(\`/api/${cfg.api}/\${editingId}\`, formData);
      } else {
        await (typeof api !== 'undefined' ? api : axios).post(\`/api/${cfg.api}\`, formData);
      }
      setEditingId(null);
      setFormData(${cfg.init});
      ${cfg.fetch};
    } catch (error) {
      console.error(error);
    }
  };`;
  
  content = content.replace(/const handleSubmit = async \(e\) => \{[\s\S]*?\n  \};/, submitFn);
  
  content = content.replace(new RegExp(`<h3(.*?)>Add New ${cfg.itemName}<\/h3>`), `<h3$1>{editingId ? 'Edit ${cfg.itemName}' : 'Add New ${cfg.itemName}'}</h3>`);
  
  content = content.replace(new RegExp(`<button type="submit"(.*?)>Add ${cfg.itemName}<\/button>`), `<div style={{ display: 'flex', gap: '8px' }}>
              {editingId && <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>}
              <button type="submit"$1>{editingId ? 'Update ${cfg.itemName}' : 'Add ${cfg.itemName}'}</button>
            </div>`);
            
  // Table buttons
  content = content.replace(/<button onClick=\{\(\) => setDeleteModalId\((.*?)\._id\)\}(.*?)>(.*?)<\/button>/g, `<div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit($1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                          </button>
                          <button onClick={() => setDeleteModalId($1._id)}$2>$3</button>
                        </div>`);

  fs.writeFileSync(filePath, content, 'utf8');
});
