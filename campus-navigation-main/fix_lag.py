import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isDragging state to Navigate
if "const [isDragging, setIsDragging]" not in content:
    content = content.replace(
        "const [isAccessible, setIsAccessible] = useState(false);",
        "const [isAccessible, setIsAccessible] = useState(false);\n    const [isDragging, setIsDragging] = useState(false);"
    )

# 2. Update DepartmentLabels definition
content = content.replace(
    "function DepartmentLabels({ nodesData, activeFloor }) {",
    "function DepartmentLabels({ nodesData, activeFloor, isDragging }) {"
)

# 3. Update DepartmentLabels invocation
content = content.replace(
    "<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />",
    "<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} isDragging={isDragging} />"
)

# 4. Update Html style
# We need to find the specific Html tag in DepartmentLabels
html_pattern = r"<Html key=\{idx\} position=\{pos\} center zIndexRange=\{\[0, 0\]\} style=\{\{ pointerEvents: 'none' \}\}>"
html_replacement = "<Html key={idx} position={pos} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none', display: isDragging ? 'none' : 'block' }}>"
content = re.sub(html_pattern, html_replacement, content)

# 5. Update OrbitControls
orbit_pattern = r"<OrbitControls ref=\{controlsRef\} makeDefault maxPolarAngle=\{Math\.PI / 2\.2\} minDistance=\{100\} maxDistance=\{isMobile \? 15000 : 30000\} enableDamping dampingFactor=\{0\.05\} />"
orbit_replacement = "<OrbitControls ref={controlsRef} makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={100} maxDistance={isMobile ? 15000 : 30000} enableDamping dampingFactor={0.05} onStart={() => setIsDragging(true)} onEnd={() => setIsDragging(false)} />"
content = re.sub(orbit_pattern, orbit_replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Navigate.jsx optimized for mobile panning.")
