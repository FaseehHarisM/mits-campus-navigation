import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix CameraController to NOT lock the map!
old_camera_regex = r"function CameraController\(\{[\s\S]*?return null;\s*\}"
new_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor }) {
  // Snap camera once when floor changes so user doesn't lose the map, but don't lock it!
  React.useEffect(() => {
    if (controlsRef.current && !isTracking) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  }, [activeFloor, isTracking, controlsRef]);

  useFrame((state) => {
    if (controlsRef.current) {
      if (isTracking && livePosition && displayHeading !== undefined) {
        const targetY = Y_OFFSETS[String(activeFloor)] || 0;
        controlsRef.current.target.lerp(new THREE.Vector3(livePosition.x, targetY, livePosition.z), 0.05);
        
        const rad = THREE.MathUtils.degToRad(displayHeading);
        const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 5000, 
            targetY + 4000, 
            livePosition.z - Math.sin(rad) * 5000
          );
        state.camera.position.lerp(idealCameraPos, 0.05);
        controlsRef.current.update();
      }
    }
  });
  return null;
}"""
content = re.sub(old_camera_regex, new_camera, content)

# 2. Remove is3D state
content = re.sub(r"\s*const \[is3D, setIs3D\] = useState\(true\);\s*", "\n", content)

# 3. Clean up CameraController invocation
content = re.sub(r"<CameraController([^>]*?)is3D=\{is3D\}([^>]*?)/>", r"<CameraController\1\2/>", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Unlocked Camera!")
