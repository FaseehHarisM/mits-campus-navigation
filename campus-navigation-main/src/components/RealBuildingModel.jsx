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
    if (!e.nativeEvent.shiftKey) return; 

    e.stopPropagation();
    const worldPoint = e.point;
    const dbX = Math.round(worldPoint.x - OFFSET_X);
    const dbY = Math.round(worldPoint.z - OFFSET_Z);
    
    const coordString = `X: ${dbX}, Y: ${dbY}`;
    navigator.clipboard.writeText(coordString).catch(() => {});
    
    alert(`Admin Coordinate Finder:\n\nX: ${dbX}\nY: ${dbY}\n\n(Copied to clipboard!)`);
  };

  // We apply the floor's specific scale, position, and rotation here!
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
