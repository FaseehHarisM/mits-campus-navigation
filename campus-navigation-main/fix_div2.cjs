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
  
  // Replace the exact ending block
  const badEnding = `        </table>\n      </div>\n    </div>\n  );\n}`;
  const goodEnding = `        </table>\n        </div>\n      </div>\n    </div>\n  );\n}`;
  
  if (content.includes(badEnding)) {
    content = content.replace(badEnding, goodEnding);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed missing div in ' + file);
  } else {
    console.log('Could not find bad ending in ' + file);
  }
});
