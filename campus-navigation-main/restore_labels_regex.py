import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Capture everything between `{icon}` and `</Html>`
old_regex = r"(\{icon\}\s*</span>\s*</div>\s*</div>\s*</Html>)"

new_html = """{icon}
                      </span>
                    </div>
                    
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      padding: '4px 8px', borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)',
                      zIndex: 1
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3c4043', whiteSpace: 'nowrap' }}>
                        {n.Name}
                      </span>
                    </div>
                </div>
              </Html>"""

content = re.sub(old_regex, new_html, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored Text Labels via Regex")
