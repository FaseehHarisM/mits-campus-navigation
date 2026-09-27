const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/AdminFloors.jsx',
  'src/pages/AdminEdges.jsx',
  'src/pages/AdminQR.jsx',
  'src/pages/AdminFaculty.jsx',
  'src/pages/AdminEvents.jsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // My previous script missed a closing </div> for the inner wrapper.
  // We can just add it right after </table>.
  if (content.includes('</table>\n      </div>\n    </div>')) {
    // Only 1 div was closed after table. We need 2.
    content = content.replace(/<\/table>\n      <\/div>\n    <\/div>/, '</table>\n        </div>\n      </div>\n    </div>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed missing div in ' + file);
  } else if (content.includes('</table>\n        </div>\n      </div>')) {
    // maybe it already has it? No, my replacement was literally just <table...
    // Let's just find </table> and insert </div>
    // Wait, the original had:
    // </table>
    // </div>
    // </div>
    // );
  }
});
