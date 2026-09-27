const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/AdminEdges.jsx',
  'src/pages/AdminQR.jsx',
  'src/pages/AdminFaculty.jsx',
  'src/pages/AdminEvents.jsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Just find the last </table> and add </div> right after it
  // Wait, I can just do a regex replace on the end of the file.
  // Let's replace </table>\s*</div>\s*</div>\s*\);\s*}
  
  const regex = /<\/table>\s*<\/div>\s*<\/div>\s*\);\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, '</table>\n        </div>\n      </div>\n    </div>\n  );\n}');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed missing div in ' + file);
  }
});
