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
  
  if (!content.includes('import DeleteModal')) {
    content = content.replace(/(import React.*?;)/, `$1\nimport DeleteModal from '../components/DeleteModal';`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added import to ${file}`);
  }
});
