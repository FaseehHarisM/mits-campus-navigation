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
  
  // Fix double brackets issue
  content = content.replace(/style=\{ padding: /g, `style={{ padding: `);
  content = content.replace(/gap: '4px' \}/g, `gap: '4px' }}`);
  
  fs.writeFileSync(filePath, content, 'utf8');
});
