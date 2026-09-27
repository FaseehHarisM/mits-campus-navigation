const fs = require('fs');
const path = require('path');

const updates = [
  {
    file: 'src/pages/AdminFloors.jsx',
    listVar: 'floorList',
    searchFields: ['FloorID', 'Name', 'BuildingID'],
    placeholder: 'Search floors by Name, ID, or Building...'
  },
  {
    file: 'src/pages/AdminEdges.jsx',
    listVar: 'edgeList',
    searchFields: ['EdgeID', 'StartNodeID', 'EndNodeID', 'EdgeType'],
    placeholder: 'Search edges by ID, Start, End, or Type...'
  },
  {
    file: 'src/pages/AdminQR.jsx',
    listVar: 'qrList',
    searchFields: ['QR_ID', 'NodeID'],
    placeholder: 'Search QR codes by QR ID or Node ID...'
  },
  {
    file: 'src/pages/AdminFaculty.jsx',
    listVar: 'facultyList',
    searchFields: ['FacultyID', 'Name', 'Department', 'NodeID'],
    placeholder: 'Search faculty by Name, Dept, or Node...'
  },
  {
    file: 'src/pages/AdminEvents.jsx',
    listVar: 'eventList',
    searchFields: ['EventID', 'Name', 'NodeID'],
    placeholder: 'Search events by Name, Event ID, or Node...'
  }
];

updates.forEach(config => {
  const filePath = path.join(process.cwd(), config.file);
  if (!fs.existsSync(filePath)) {
    console.log('Skipping ' + config.file + ' - not found');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('searchTerm') && content.includes('setSearchTerm')) {
    console.log('Skipping ' + config.file + ' - already has search');
    return;
  }

  content = content.replace(
    /const \[loading, setLoading\] = useState\(true\);/g,
    "const [loading, setLoading] = useState(true);\n  const [searchTerm, setSearchTerm] = useState('');"
  );

  const filterLogic = `
  const filteredList = ${config.listVar}.filter(item => 
    ${config.searchFields.map(f => `(item.${f} && item.${f}.toLowerCase().includes(searchTerm.toLowerCase()))`).join(' ||\n    ')}
  );
  `;
  content = content.replace(
    /return \(/,
    `${filterLogic}\n  return (`
  );

  const searchUI = `
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#5f6368', marginRight: '8px' }}>search</span>
          <input 
            type="text" 
            placeholder="${config.placeholder}" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', width: '100%', color: '#3c4043' }}
          />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table`;
  
  content = content.replace(
    /<div style=\{\{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' \}\}>\s*<table/g,
    searchUI
  );

  const mapRegex = new RegExp(`${config.listVar}\\.map\\(`, 'g');
  content = content.replace(mapRegex, `filteredList.map(`);
  
  const noResultsLogic = `
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No results found matching your search.</td></tr>
              )}
            </tbody>`;
  content = content.replace(/\s*<\/tbody>/, noResultsLogic);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated ' + config.file);
});
