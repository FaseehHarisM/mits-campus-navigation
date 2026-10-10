import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Bring back icons during tracking! (Remove the {!isTracking && } wrapper)
content = re.sub(r'\{!isTracking && <DepartmentLabels nodesData=\{nodesData\} activeFloor=\{activeFloor\} \/>\}', '<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />', content)

# 2. Adjust Camera to be a 45-degree angle 3D perspective instead of Top-Down
def replace_cam(match):
    return """const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 5000, 
            targetY + 4000, 
            livePosition.z - Math.sin(rad) * 5000
          );"""
content = re.sub(r'const idealCameraPos = new THREE\.Vector3\([\s\S]*?\);', replace_cam, content)

# 3. Lock resolution to strictly 1x to aggressively fight lag on mobile
content = re.sub(r'dpr=\{\[1, 1\.5\]\}', 'dpr={[1, 1]}', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied fixes for icons, camera angle, and strict 1x resolution.")
