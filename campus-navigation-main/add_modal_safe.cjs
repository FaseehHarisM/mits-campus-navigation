const fs = require('fs');
const path = require('path');

const files = [
  'AdminNodes.jsx', 'AdminEdges.jsx', 'AdminQR.jsx', 
  'AdminFloors.jsx', 'AdminEvents.jsx', 'AdminFaculty.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('DeleteModal')) {
    content = content.replace(/(import React.*?;\n)/, `$1import DeleteModal from '../components/DeleteModal';\n`);
  }
  
  if (!content.includes('deleteModalId')) {
    content = content.replace(/(const \[.*?\] = useState\(.*?\);)/, `$1\n  const [deleteModalId, setDeleteModalId] = useState(null);`);
  }
  
  // Replace button onClick to trigger the modal
  content = content.replace(/onClick=\{\(\) => handleDelete\((.*?)\)\}/g, `onClick={() => setDeleteModalId($1)}`);
  
  // Safely bypass window.confirm without breaking AST
  content = content.replace(/if\s*\(window\.confirm\(/g, `if (true || window.confirm(`);
  
  if (!content.includes('<DeleteModal')) {
    content = content.replace(/(<\/div>\s*)\)(?=\s*;\s*})/g, `  <DeleteModal 
        isOpen={!!deleteModalId} 
        onCancel={() => setDeleteModalId(null)}
        onConfirm={() => {
          handleDelete(deleteModalId);
          setDeleteModalId(null);
        }}
      />\n$1)`);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
