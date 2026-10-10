import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add cameraAnimation state to Navigate
state_hook = """  export default function Navigate({ setActiveTab, currentLocation, destination, setDestination }) {
    const [activeRoute, setActiveRoute] = useState(null);
    const [routeError, setRouteError] = useState(null);
    const [cameraAnimation, setCameraAnimation] = useState(null);"""
content = re.sub(r"  export default function Navigate\(\{ setActiveTab, currentLocation, destination, setDestination \}\) \{\s*const \[activeRoute, setActiveRoute\] = useState\(null\);\s*const \[routeError, setRouteError\] = useState\(null\);", state_hook, content)


# 2. Modify CameraController to accept and process cameraAnimation
content = re.sub(r"function CameraController\(\{ isTracking, livePosition, controlsRef, displayHeading, activeFloor \}\) \{", "function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, cameraAnimation, setCameraAnimation }) {", content)

old_logic = """      } else {
        // Just snap focus to the active floor center
        controlsRef.current.target.lerp(new THREE.Vector3(0, targetY, 0), 0.05);
        controlsRef.current.maxPolarAngle = Math.PI; 
        controlsRef.current.minPolarAngle = 0;
      }
      controlsRef.current.update();"""

new_logic = """      } else {
        controlsRef.current.maxPolarAngle = Math.PI; 
        controlsRef.current.minPolarAngle = 0;
        if (cameraAnimation) {
          controlsRef.current.target.lerp(cameraAnimation.target, 0.05);
          state.camera.position.lerp(cameraAnimation.position, 0.05);
          
          if (controlsRef.current.target.distanceTo(cameraAnimation.target) < 20 && state.camera.position.distanceTo(cameraAnimation.position) < 20) {
            setCameraAnimation(null);
          }
        } else if (!activeRoute) {
          // Only snap to center if no route is active
          controlsRef.current.target.lerp(new THREE.Vector3(0, targetY, 0), 0.05);
        }
      }
      controlsRef.current.update();"""

# I need to pass activeRoute into CameraController as well to stop snapping to center
content = re.sub(r"function CameraController\(\{ isTracking, livePosition, controlsRef, displayHeading, activeFloor, cameraAnimation, setCameraAnimation \}\) \{", "function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, cameraAnimation, setCameraAnimation, activeRoute }) {", content)

content = re.sub(re.escape(old_logic).replace(r'\n', r'\r?\n'), new_logic, content)

# 3. Pass props to CameraController
content = re.sub(r"<CameraController isTracking=\{isTracking\} livePosition=\{livePosition\} controlsRef=\{controlsRef\} displayHeading=\{heading\} activeFloor=\{activeFloor\} />", "<CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={heading} activeFloor={activeFloor} cameraAnimation={cameraAnimation} setCameraAnimation={setCameraAnimation} activeRoute={activeRoute} />", content)


# 4. Modify handleStartNavigation to trigger animation
old_handler = """  const handleStartNavigation = () => {
    setCompassOffset(null);
    if (!currentLocation || !destination) {
      alert("Please ensure both current location and destination are set.");
      return;
    }
    calculateRoute();
  };"""

new_handler = """  const handleStartNavigation = () => {
    setCompassOffset(null);
    if (!activeRoute || !activeRoute.pathPoints || activeRoute.pathPoints.length === 0) return;
    
    const targetY = Y_OFFSETS[String(activeFloor)] || 0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    activeRoute.pathPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const routeLengthX = maxX - minX;
    const routeLengthZ = maxZ - minZ;
    const maxDim = Math.max(routeLengthX, routeLengthZ, 1000);
    const zoomDistance = maxDim * 1.5; 

    setCameraAnimation({
      target: new THREE.Vector3(centerX, targetY, centerZ),
      position: new THREE.Vector3(centerX, targetY + zoomDistance, centerZ + zoomDistance * 0.8)
    });
  };"""
content = re.sub(re.escape(old_handler).replace(r'\n', r'\r?\n'), new_handler, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Google Maps Flyover Preview")
