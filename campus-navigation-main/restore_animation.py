import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_camera_regex = r"function CameraController\(\{ isTracking, livePosition, controlsRef, displayHeading, activeFloor \}\) \{[\s\S]*?return null;\s*\}"

new_camera = """function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, cameraAnimation, setCameraAnimation }) {
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
      } else if (cameraAnimation) {
        controlsRef.current.target.lerp(cameraAnimation.target, 0.05);
        state.camera.position.lerp(cameraAnimation.position, 0.05);
        controlsRef.current.update();
        
        if (controlsRef.current.target.distanceTo(cameraAnimation.target) < 20 && state.camera.position.distanceTo(cameraAnimation.position) < 20) {
          setCameraAnimation(null);
        }
      }
    }
  });
  return null;
}"""

content = re.sub(old_camera_regex, new_camera, content)

# Update invocation
content = re.sub(r"<CameraController isTracking=\{isTracking\} livePosition=\{livePosition\} controlsRef=\{controlsRef\} displayHeading=\{compassOffset !== null \? \(heading \+ compassOffset\) : currentPathAngle\} activeFloor=\{activeFloor\} />", "<CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={compassOffset !== null ? (heading + compassOffset) : currentPathAngle} activeFloor={activeFloor} cameraAnimation={cameraAnimation} setCameraAnimation={setCameraAnimation} />", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored Camera Animation")
