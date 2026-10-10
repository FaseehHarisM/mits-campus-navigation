import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Re-hide labels to fix the lag
content = re.sub(r'<DepartmentLabels nodesData=\{nodesData\} activeFloor=\{activeFloor\}\s*\/>', '{!isTracking && <DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />}', content)

# 2. Fix the Mobile Max Distance Trap
content = re.sub(r'maxDistance=\{.*?\}', 'maxDistance={isMobile ? 15000 : 30000}', content)

# 3. Elevate the tracking camera above the massive Revit building roof using regex!
def replace_cam(match):
    return """const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 3000, 
            targetY + 8000, 
            livePosition.z - Math.sin(rad) * 3000
          );"""
content = re.sub(r'const idealCameraPos = new THREE\.Vector3\([\s\S]*?\);', replace_cam, content)

# 4. Elevate the blue tube to 80
content = re.sub(r'svgToWorld\(n\.X, n\.Y, \d+, n\.Floor\)', 'svgToWorld(n.X, n.Y, 80, n.Floor)', content)

# 5. Make the blue line thicccc so it's visible from 8000 units up
# new THREE.TubeGeometry(curve, 128, 10, 8, false);
content = re.sub(r'new THREE\.TubeGeometry\(curve, 128, \d+, 8, false\)', 'new THREE.TubeGeometry(curve, 128, 40, 8, false)', content)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied aggressive regex fixes for Revit model tracking.")
