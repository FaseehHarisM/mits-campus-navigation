import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove isDragging prop from DepartmentLabels
content = content.replace("function DepartmentLabels({ nodesData, activeFloor, isDragging }) {", "function DepartmentLabels({ nodesData, activeFloor }) {")

# 2. Remove display: isDragging ? 'none' : 'block'
content = content.replace("display: isDragging ? 'none' : 'block'", "display: 'block'")

# 3. Remove isDragging state from Navigate
content = content.replace("const [isDragging, setIsDragging] = useState(false);", "")

# 4. Remove isDragging prop passed to DepartmentLabels
content = content.replace("<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} isDragging={isDragging} />", "<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />")

# 5. Remove onStart and onEnd from OrbitControls
content = re.sub(
    r"onStart=\{\(\) => setIsDragging\(true\)\}\s*onEnd=\{\(\) => setIsDragging\(false\)\}",
    "",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("isDragging removed")
