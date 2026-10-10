import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add is3D state to Navigate component
state_hook = """  export default function Navigate({ setActiveTab, currentLocation, destination, setDestination }) {
    const [activeRoute, setActiveRoute] = useState(null);
    const [routeError, setRouteError] = useState(null);
    const [is3D, setIs3D] = useState(true);"""
content = re.sub(r"  export default function Navigate\(\{ setActiveTab, currentLocation, destination, setDestination \}\) \{\s*const \[activeRoute, setActiveRoute\] = useState\(null\);\s*const \[routeError, setRouteError\] = useState\(null\);", state_hook, content)


# 2. Modify CameraController to accept is3D and animate
content = re.sub(r"function CameraController\(\{ isTracking, livePosition, controlsRef, displayHeading, activeFloor \}\) \{", "function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, is3D }) {", content)

old_logic = """        } else {
          // Just snap focus to the active floor center
          controlsRef.current.target.lerp(new THREE.Vector3(0, targetY, 0), 0.05);
        }
        controlsRef.current.update();"""

new_logic = """        } else {
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
        controlsRef.current.update();"""
content = re.sub(re.escape(old_logic).replace(r'\n', r'\r?\n'), new_logic, content)

# 3. Pass is3D to CameraController
content = re.sub(r"<CameraController isTracking=\{isTracking\} livePosition=\{livePosition\} controlsRef=\{controlsRef\} displayHeading=\{heading\} activeFloor=\{activeFloor\} />", "<CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={heading} activeFloor={activeFloor} is3D={is3D} />", content)

# 4. Modify the Map button
old_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4' }} onClick={handleStartNavigation}>
                     <span className="material-symbols-outlined">route</span> Map
                   </button>
                 )}"""

new_btn = """                 {!isTracking && (
                   <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setIs3D(!is3D)}>
                     <span className="material-symbols-outlined">{is3D ? 'map' : '3d_rotation'}</span> {is3D ? '2D Map' : '3D Map'}
                   </button>
                 )}"""
content = re.sub(re.escape(old_btn).replace(r'\n', r'\r?\n'), new_btn, content)


# Note: Wait! If I didn't match old_btn perfectly due to spacing, I'll just use regex
btn_regex = r"\{\!isTracking && \(\s*<button className=\"btn-outline\" [^>]*onClick=\{handleStartNavigation\}>\s*<span className=\"material-symbols-outlined\">route</span> Map\s*</button>\s*\)\}"
content = re.sub(btn_regex, new_btn, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Actually Updated 3D/2D animation")
