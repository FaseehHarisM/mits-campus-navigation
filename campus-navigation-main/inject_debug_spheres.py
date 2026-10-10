import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

injection = """          <Html key={idx} position={pos} center  style={{ pointerEvents: 'none', display: 'block' }}>
              <div style={{
"""
new_injection = """          <group key={"debug_wrapper"+idx}>
             <mesh position={pos}>
               <sphereGeometry args={[150, 16, 16]} />
               <meshBasicMaterial color="#ff0000" />
             </mesh>
             <Html key={idx} position={pos} center  style={{ pointerEvents: 'none', display: 'block' }}>
              <div style={{
"""

content = content.replace(injection, new_injection)
content = content.replace("                  </Html>", "                  </Html>\n          </group>")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Debug Spheres")
