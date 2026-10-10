import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Re-hide labels to fix the lag
content = content.replace('<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />', '{!isTracking && <DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />}')

# 2. Fix the Mobile Max Distance Trap (which was forcing the camera into the roof)
content = content.replace('maxDistance={isMobile ? 3000 : 30000}', 'maxDistance={isMobile ? 15000 : 30000}')

# 3. Elevate the tracking camera above the massive Revit building roof
old_cam = """          const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 1500, 
            targetY + 1200, 
            livePosition.z - Math.sin(rad) * 1500
          );"""

new_cam = """          const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 3000, 
            targetY + 8000, 
            livePosition.z - Math.sin(rad) * 3000
          );"""
content = content.replace(old_cam, new_cam)

# 4. Just to be safe, elevate the blue tube even higher to avoid any floor slabs
content = content.replace('svgToWorld(n.X, n.Y, 50, n.Floor)', 'svgToWorld(n.X, n.Y, 80, n.Floor)')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied mega-scale fixes for Revit model tracking.")
