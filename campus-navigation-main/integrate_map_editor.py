import os
import re

# 1. Update AdminDashboard.jsx
ad_path = os.path.join('src', 'pages', 'AdminDashboard.jsx')
with open(ad_path, 'r', encoding='utf-8') as f:
    ad_content = f.read()

ad_content = ad_content.replace("import AdminFloors from './AdminFloors';", "import AdminFloors from './AdminFloors';\nimport AdminMapEditor from './AdminMapEditor';")
ad_content = ad_content.replace("{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },", "{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },\n    { id: 'mapeditor', label: 'Visual Map Editor', icon: 'map' },")
ad_content = ad_content.replace("{activePage === 'dashboard' && <Overview />}", "{activePage === 'dashboard' && <Overview />}\n          {activePage === 'mapeditor' && <AdminMapEditor />}")

with open(ad_path, 'w', encoding='utf-8') as f:
    f.write(ad_content)

# 2. Update Navigate.jsx (Remove Shift+Click)
nav_path = os.path.join('src', 'pages', 'Navigate.jsx')
with open(nav_path, 'r', encoding='utf-8') as f:
    nav_content = f.read()

# We need to target the mesh onPointerDown which contains e.shiftKey
nav_content = re.sub(r'onPointerDown=\{\(e\) => \{\s*if \(e\.shiftKey\) \{[\s\S]*?\}\s*\}\}', 'onPointerDown={(e) => { /* Visual editor now in Admin */ }}', nav_content)

with open(nav_path, 'w', encoding='utf-8') as f:
    f.write(nav_content)

# 3. Update Home.jsx (Hide Admin Login on Mobile)
home_path = os.path.join('src', 'pages', 'Home.jsx')
with open(home_path, 'r', encoding='utf-8') as f:
    home_content = f.read()

# Replace the specific div wrapping the Admin Link
old_admin_block = """{/* Professional Admin Link & Copyright */}
      <div style={{ marginTop: '64px', textAlign: 'center', borderTop: '1px solid #dadce0', paddingTop: '24px' }}>
        <button 
          onClick={() => setActiveTab('admin')} 
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mits-red)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", marginBottom: '16px', transition: 'color 0.2s' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
          Admin Login
        </button>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
          &copy; {new Date().getFullYear()} Faseeh Haris M. All rights reserved.
        </p>
      </div>"""

new_admin_block = """{/* Professional Admin Link & Copyright */}
      <div style={{ marginTop: '64px', textAlign: 'center', borderTop: '1px solid #dadce0', paddingTop: '24px' }}>
        {window.innerWidth > 768 && (
          <button 
            onClick={() => setActiveTab('admin')} 
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--mits-red)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", marginBottom: '16px', transition: 'color 0.2s' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
            Admin Login
          </button>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
          &copy; {new Date().getFullYear()} Faseeh Haris M. All rights reserved.
        </p>
      </div>"""

home_content = home_content.replace(old_admin_block, new_admin_block)

with open(home_path, 'w', encoding='utf-8') as f:
    f.write(home_content)

print("Applied Admin Map Editor integration and mobile restrictions.")
