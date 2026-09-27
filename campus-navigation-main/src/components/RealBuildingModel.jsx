import React, { useEffect } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { CAMPUS_BUILDINGS } from '../config/buildings';
import * as THREE from 'three';

export function RealBuildingModel({ activeBuilding, activeFloor }) {
  const building = CAMPUS_BUILDINGS[activeBuilding];
  if (!building) return null;

  return (
    <group>
      {building.floors.map((floor) => (
        <FloorModel 
          key={floor.id}
          floor={floor}
          isActive={floor.id === activeFloor}
        />
      ))}
    </group>
  );
}

function FloorModel({ floor, isActive }) {
  const { scene } = useGLTF(floor.path);

  useEffect(() => {
    if (scene) {
      const googleMapsMaterial = new THREE.MeshStandardMaterial({
        color: '#f0f3f4',
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide
      });

      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = googleMapsMaterial;
        }
      });
    }
  }, [scene]);

  if (!scene) return null;

  const OFFSET_X = -1920 / 2;
  const OFFSET_Z = -1080 / 2;

  const handleClick = (e) => {
    // Require Shift key so it doesn't copy when dragging the camera
    if (!e.shiftKey && !(e.nativeEvent && e.nativeEvent.shiftKey)) return; 
    e.stopPropagation();

    // Use the absolute, mathematically exact 3D point you clicked!
    // I removed the parallax compensators because they were artificially distorting the coordinates.
    // Combined with the new CSS fix in Navigate.jsx, this will now be 100% pixel-perfect.
    const worldX = e.point.x;
    const worldZ = e.point.z;

    const dbX = Math.round(worldX - OFFSET_X);
    const dbY = Math.round(worldZ - OFFSET_Z);
    
    const coordString = `X: ${dbX}, Y: ${dbY}`;
    navigator.clipboard.writeText(coordString).catch(() => {});
    
    // Elegant Vanilla JS Toast
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#3c4043';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '24px';
    toast.style.zIndex = '99999999';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    toast.style.pointerEvents = 'none';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';
    toast.innerHTML = `<span class="material-symbols-outlined">content_copy</span> Copied! X: ${dbX}, Y: ${dbY}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) document.body.removeChild(toast);
    }, 3000);
  };

  const transform = floor.transform || { scale: [200,200,200], position: [0,0,0], rotation: [0,0,0] };

  return (
    <group visible={isActive} position={[0, floor.heightOffset, 0]}>
      <Center top>
        <primitive 
          object={scene} 
          scale={transform.scale}
          position={transform.position}
          rotation={transform.rotation}
          onClick={handleClick}
        />
      </Center>
    </group>
  );
}

Object.values(CAMPUS_BUILDINGS).forEach(b => {
  b.floors.forEach(f => {
    useGLTF.preload(f.path);
  });
});
