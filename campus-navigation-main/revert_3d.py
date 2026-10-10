import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove is3D state
content = re.sub(r"    const \[is3D, setIs3D\] = useState\(true\);\s*", "", content)

# 2. Restore CameraController
old_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, is3D }) {
  useFrame((state) => {
    if (controlsRef.current) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;
      
      if (isTracking && livePosition && displayHeading !== undefined) {
        controlsRef.current.target.lerp(new THREE.Vector3(livePosition.x, targetY, livePosition.z), 0.05);
        
        const rad = THREE.MathUtils.degToRad(displayHeading);
        const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 5000, 
            targetY + 4000, 
            livePosition.z - Math.sin(rad) * 5000
          );
        state.camera.position.lerp(idealCameraPos, 0.05);
      } else {
        controlsRef.current.target.lerp(new THREE.Vector3(0, targetY, 0), 0.05);
        
        if (is3D) {
          controlsRef.current.maxPolarAngle = Math.PI / 2.2;
          controlsRef.current.minPolarAngle = 0;
        } else {
          const ideal2DPos = new THREE.Vector3(0, targetY + 6000, 0.1);
          state.camera.position.lerp(ideal2DPos, 0.05);
          controlsRef.current.maxPolarAngle = 0;
          controlsRef.current.minPolarAngle = 0;
        }
      }
      controlsRef.current.update();
    }
  });
  return null;
}"""

new_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor }) {
  useFrame((state) => {
    if (controlsRef.current) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;
      
      if (isTracking && livePosition && displayHeading !== undefined) {
        controlsRef.current.target.lerp(new THREE.Vector3(livePosition.x, targetY, livePosition.z), 0.05);
        
        const rad = THREE.MathUtils.degToRad(displayHeading);
        const idealCameraPos = new THREE.Vector3(
            livePosition.x - Math.cos(rad) * 5000, 
            targetY + 4000, 
            livePosition.z - Math.sin(rad) * 5000
          );
        state.camera.position.lerp(idealCameraPos, 0.05);
      } else {
        // Just snap focus to the active floor center
        controlsRef.current.target.lerp(new THREE.Vector3(0, targetY, 0), 0.05);
        controlsRef.current.maxPolarAngle = Math.PI; 
        controlsRef.current.minPolarAngle = 0;
      }
      controlsRef.current.update();
    }
  });
  return null;
}"""
content = re.sub(re.escape(old_camera).replace(r'\n', r'\r?\n'), new_camera, content)

# 3. Remove is3D from CameraController usage
content = re.sub(r"is3D=\{is3D\} />", "/>", content)

# 4. Restore the Map button
old_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIs3D(!is3D)}>
                     <span className="material-symbols-outlined">{is3D ? 'map' : '3d_rotation'}</span> {is3D ? '2D Map' : '3D Map'}
                   </button>
                 )}"""

new_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4' }} onClick={handleStartNavigation}>
                     <span className="material-symbols-outlined">route</span> Map
                   </button>
                 )}"""
content = re.sub(re.escape(old_btn).replace(r'\n', r'\r?\n'), new_btn, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted 3D toggle changes")
