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
  
  // 1. Add import
  if (!content.includes('DeleteModal')) {
    content = content.replace(/(import React.*?;\n)/, `$1import DeleteModal from '../components/DeleteModal';\n`);
  }
  
  // 2. Add state inside component
  if (!content.includes('deleteModalId')) {
    // Find the first useState
    content = content.replace(/(const \[.*?\] = useState\(.*?\);)/, `$1\n  const [deleteModalId, setDeleteModalId] = useState(null);`);
  }
  
  // 3. Update handleDelete logic
  // We need to change `if (window.confirm(...))` to use the modal.
  // This is tricky with regex. Instead of regex replacing the function, we can just replace the button onClick!
  
  // Change the Delete button to open the modal instead of calling handleDelete directly
  // e.g. onClick={() => handleDelete(node._id)}  ->  onClick={() => setDeleteModalId(node._id)}
  
  // Regex to match: onClick={() => handleDelete(VAR._id)}
  content = content.replace(/onClick=\{\(\) => handleDelete\((.*?)\)\}/g, `onClick={() => setDeleteModalId($1)}`);
  
  // Now we need to modify the handleDelete function itself to NOT use window.confirm
  content = content.replace(/if\s*\(window\.confirm\(.*?\)\)\s*\{([\s\S]*?)\}(?=\s*catch|\s*};)/g, `$1`);
  content = content.replace(/if\s*\(window\.confirm\(.*?\)\)\s*\{([\s\S]*?)\}\s*};/g, `$1\n  };`);
  
  // Remove empty catch blocks if they exist (optional, but good)
  
  // 4. Inject the DeleteModal component at the end of the return statement
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
