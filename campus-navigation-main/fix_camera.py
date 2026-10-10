import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restore labels (remove the {!isTracking && } condition I added earlier)
content = content.replace('{!isTracking && <DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />}', '<DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />')

# 2. Fix camera tracking math for massive real-world maps
old_cam = """          const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 450, 
            targetY + 350, 
            livePosition.z - Math.sin(rad) * 450
          );"""

new_cam = """          const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 1500, 
            targetY + 1200, 
            livePosition.z - Math.sin(rad) * 1500
          );"""
          
content = content.replace(old_cam, new_cam)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored labels and fixed camera tracking math.")
