import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add is3D state to Navigate component
state_hook = """  export default function Navigate({ setActiveTab, currentLocation, destination, setDestination }) {
    const [activeRoute, setActiveRoute] = useState(null);
    const [is3D, setIs3D] = useState(true);"""
content = re.sub(r"  export default function Navigate\(\{ setActiveTab, currentLocation, destination, setDestination \}\) \{\s*const \[activeRoute, setActiveRoute\] = useState\(null\);", state_hook, content)

# 2. Modify CameraController to accept is3D and animate
old_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor }) {
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
      }
      controlsRef.current.update();
    }
  });
  return null;
}"""

new_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, is3D }) {
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
          // If 3D, allow max polar angle to be tilted
          controlsRef.current.maxPolarAngle = Math.PI / 2.2;
          controlsRef.current.minPolarAngle = 0;
        } else {
          // If 2D, force top-down view by lerping camera
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
content = content.replace(old_camera, new_camera)

# 3. Pass is3D to CameraController
content = content.replace("<CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={heading} activeFloor={activeFloor} />", 
                          "<CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={heading} activeFloor={activeFloor} is3D={is3D} />")

# 4. Modify the Map button
old_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4' }} onClick={handleStartNavigation}>
                     <span className="material-symbols-outlined">route</span> Map
                   </button>
                 )}"""

new_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4' }} onClick={() => setIs3D(!is3D)}>
                     <span className="material-symbols-outlined">{is3D ? 'map' : '3d_rotation'}</span> {is3D ? '2D Map' : '3D Map'}
                   </button>
                 )}"""
content = content.replace(old_btn, new_btn)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated 3D/2D animation")
