import os
import re

filepath = os.path.join('src', 'pages', 'Home.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
state_injection = """  const [events, setEvents] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);"""
content = content.replace("  const [events, setEvents] = useState([]);\n  const [nodes, setNodes] = useState([]);", state_injection)

# 2. Add filtering logic before return
filter_logic = """  const getRoomName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    return node ? node.Name : nodeId;
  };

  const filteredNodes = nodes.filter(n => n.Name && n.Name.toLowerCase().includes(searchTerm.toLowerCase()));"""
content = content.replace("  const getRoomName = (nodeId) => {\n    const node = nodes.find(n => n.NodeID === nodeId);\n    return node ? node.Name : nodeId;\n  };", filter_logic)

# 3. Replace the search bar
old_search = """      <div className="search-bar" style={{ marginBottom: '24px', padding: '14px 20px' }} onClick={() => setActiveTab('navigate')}>
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search destination..." readOnly style={{ cursor: 'pointer', background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)', fontWeight: 500 }} />
      </div>"""

new_search = """      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div className="search-bar" style={{ padding: '14px 20px', zIndex: 10, position: 'relative' }}>
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="Search destination..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)', fontWeight: 500 }} 
          />
          {searchTerm && (
            <span className="material-symbols-outlined" style={{ cursor: 'pointer', color: '#5f6368', fontSize: '20px' }} onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}>close</span>
          )}
        </div>
        
        {showSuggestions && searchTerm && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: '300px', overflowY: 'auto', marginTop: '8px', border: '1px solid #e0e0e0' }}>
            {filteredNodes.length > 0 ? (
              filteredNodes.map(node => (
                <div 
                  key={node.NodeID}
                  onClick={() => {
                    setSearchTerm('');
                    setShowSuggestions(false);
                    handleNavigation(node.Name);
                  }}
                  style={{ padding: '16px 20px', borderBottom: '1px solid #f1f3f4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#1a73e8' }}>location_on</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#3c4043' }}>{node.Name}</div>
                    <div style={{ fontSize: '12px', color: '#5f6368' }}>Floor: {node.FloorID} • {node.Type}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#5f6368' }}>No locations found</div>
            )}
          </div>
        )}
      </div>"""

content = content.replace(old_search, new_search)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Home search bar upgraded to real autocomplete.")
