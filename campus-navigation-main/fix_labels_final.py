import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Using regex to find the entire Html block inside DepartmentLabels
html_regex = re.compile(
    r"<Html key=\{idx\} position=\{pos\} center  style=\{\{ pointerEvents: 'none', display: 'block' \}\}>.*?</Html>",
    re.DOTALL
)

replacement = """
            <group key={idx}>
              <mesh position={pos}>
                <sphereGeometry args={[25, 16, 16]} />
                <meshBasicMaterial color={color} />
                <Html position={[0, 30, 0]} center style={{ pointerEvents: 'none' }}>
                  <div style={{
                    background: color, padding: '2px 8px', borderRadius: '12px',
                    color: 'white', fontWeight: 'bold', fontSize: '10px',
                    whiteSpace: 'nowrap', border: '2px solid white',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}>
                    {n.Name}
                  </div>
                </Html>
              </mesh>
            </group>
"""

new_content = html_regex.sub(replacement.strip(), content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced DepartmentLabels with Mesh + Html combination!")
