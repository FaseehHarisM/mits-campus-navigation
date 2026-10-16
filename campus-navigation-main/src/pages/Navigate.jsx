import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getNodes, getEdges } from '../services/api';
import usePDR from '../hooks/usePDR';
import { RealBuildingModel } from '../components/RealBuildingModel';
import { ModelErrorBoundary } from '../components/ModelErrorBoundary';
import { CAMPUS_BUILDINGS } from '../config/buildings';

const SVG_W = 1920;
const SVG_H = 1080;
const OFFSET_X = -SVG_W / 2;
const OFFSET_Z = -SVG_H / 2;
const WALL_HEIGHT = 35; 
const WALL_THICKNESS = 14;

// Realistic College Building Scaling:
// Ramanujan Block is ~75m in length (1920 SVG pixels)
// 1 meter ≈ 25 SVG pixels
// 1 normal walking step ≈ 0.75m ≈ 19 SVG pixels (~1.3 steps per meter)
const PIXELS_PER_METER = 25;
const PIXELS_PER_STEP = 19;

const Y_OFFSETS = { '-1': -600, '0': 0, '1': 600 };

function svgToWorld(sx, sy, height = 0, floorStr = '0') {
  return [sx + OFFSET_X, (Y_OFFSETS[String(floorStr)] || 0) + height, sy + OFFSET_Z];
}

// --- DIJKSTRA'S ALGORITHM ---
function runDijkstra(startNodeID, endNodeID, nodesData, graphData, isAccessible) {
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  nodesData.forEach(n => {
    distances[n.NodeID] = Infinity;
    previous[n.NodeID] = null;
    unvisited.add(n.NodeID);
  });

  distances[startNodeID] = 0;

  while (unvisited.size > 0) {
    let currNode = null;
    let minDistance = Infinity;
    
    for (let node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        currNode = node;
      }
    }

    if (currNode === null || currNode === endNodeID) break;

    unvisited.delete(currNode);

    for (let neighbor in graphData[currNode]) {
      if (!unvisited.has(neighbor)) continue;
      
      const edge = graphData[currNode][neighbor];
      if (isAccessible && edge.type === 'stairs') continue;

      const newDist = distances[currNode] + edge.distance;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previous[neighbor] = currNode;
      }
    }
  }

  if (distances[endNodeID] === Infinity) return null;

  const path = [];
  let curr = endNodeID;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    pathNodeIDs: path,
    totalDistance: distances[endNodeID]
  };
}

// --- TURN-BY-TURN MANEUVER GENERATOR (GOOGLE MAPS STYLE) ---
function calculateManeuvers(points, pathNodes) {
  if (!points || points.length < 2) return [];
  const maneuvers = [];
  let cumDist = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const n1 = pathNodes[i];
    const n2 = pathNodes[i + 1];
    const segDist = Math.hypot(p2.x - p1.x, p2.z - p1.z);

    if (i === 0) {
      let icon = 'straight';
      let text = 'Head forward';
      let speech = 'head forward along the corridor';
      if (n2?.Name && n2.Type !== 'Junction') {
        text = `Head toward ${n2.Name}`;
        speech = `head toward ${n2.Name}`;
      }
      if (n1.Floor !== n2.Floor) {
        const isElev = n1.Type === 'Elevator';
        const floorName = n2.Floor === '0' ? '1st Floor' : n2.Floor === '1' ? '2nd Floor' : 'Ground Floor';
        icon = isElev ? 'elevator' : 'stairs';
        text = `Take ${isElev ? 'elevator' : 'stairs'} to ${floorName}`;
        speech = `take ${isElev ? 'the elevator' : 'the stairs'} to ${floorName}`;
      }
      maneuvers.push({
        id: 0,
        distFromStart: 0,
        icon,
        instruction: text,
        speech,
        targetNode: n2
      });
    } else {
      const p0 = points[i - 1];

      if (n1.Floor !== n2.Floor) {
        const isElev = n1.Type === 'Elevator';
        const floorLabel = n2.Floor === '0' ? '1st Floor' : n2.Floor === '1' ? '2nd Floor' : 'Ground Floor';
        const actionText = `Take ${isElev ? 'elevator' : 'stairs'} to ${floorLabel}`;
        maneuvers.push({
          id: i,
          distFromStart: cumDist,
          icon: isElev ? 'elevator' : 'stairs',
          instruction: actionText,
          speech: `take ${isElev ? 'the elevator' : 'the stairs'} to ${floorLabel}`,
          targetNode: n2
        });
      } else if (pathNodes[i - 1].Floor !== n1.Floor) {
        // Exiting elevator or stairs on new floor - no bogus U-turn!
        const wasElev = pathNodes[i - 1].Type === 'Elevator';
        const exitText = `Exit ${wasElev ? 'elevator' : 'stairs'}${n2?.Name && n2.Type !== 'Junction' ? ' toward ' + n2.Name : ''}`;
        maneuvers.push({
          id: i,
          distFromStart: cumDist,
          icon: 'door_front',
          instruction: exitText,
          speech: `exit ${wasElev ? 'the elevator' : 'the stairs'}${n2?.Name && n2.Type !== 'Junction' ? ' toward ' + n2.Name : ''}`,
          targetNode: n2
        });
      } else {
        const dx1 = p1.x - p0.x;
        const dz1 = p1.z - p0.z;
        const dx2 = p2.x - p1.x;
        const dz2 = p2.z - p1.z;

        const a1 = Math.atan2(dz1, dx1);
        const a2 = Math.atan2(dz2, dx2);
        let diff = ((a2 - a1) * 180) / Math.PI;
        if (diff > 180) diff -= 360;
        if (diff <= -180) diff += 360;

        let icon = null;
        let turnWord = '';

        if (diff > 35 && diff <= 125) {
          icon = 'turn_right';
          turnWord = 'Turn right';
        } else if (diff < -35 && diff >= -125) {
          icon = 'turn_left';
          turnWord = 'Turn left';
        } else if (diff > 125 || diff < -125) {
          icon = 'u_turn_left';
          turnWord = 'Make a U-turn';
        } else if (diff > 15 && diff <= 35) {
          icon = 'turn_slight_right';
          turnWord = 'Keep slight right';
        } else if (diff < -15 && diff >= -35) {
          icon = 'turn_slight_left';
          turnWord = 'Keep slight left';
        }

        const isLastSegment = (i === points.length - 2);
        if (icon || isLastSegment) {
          let text = turnWord || 'Continue straight';
          let speech = turnWord ? turnWord.toLowerCase() : 'continue straight';
          if (isLastSegment && n2?.Name) {
            text = `${text ? text + ' to' : 'Arrive at'} ${n2.Name}`;
            speech = `${speech ? speech + ' to ' : 'destination '} ${n2.Name} is ahead`;
          } else if (n2?.Name && n2.Type !== 'Junction') {
            text = `${text} toward ${n2.Name}`;
            speech = `${speech} toward ${n2.Name}`;
          }

          maneuvers.push({
            id: i,
            distFromStart: cumDist,
            icon: icon || 'straight',
            instruction: text,
            speech,
            targetNode: n2
          });
        }
      }
    }

    cumDist += segDist;
  }

  // Final destination
  maneuvers.push({
    id: points.length - 1,
    distFromStart: cumDist,
    icon: 'pin_drop',
    instruction: `Arrive at ${pathNodes[pathNodes.length - 1]?.Name || 'Destination'}`,
    speech: `destination reached. You have arrived at ${pathNodes[pathNodes.length - 1]?.Name || 'your destination'}.`,
    targetNode: pathNodes[pathNodes.length - 1]
  });

  return maneuvers;
}

function IsometricFloorPlan({ activeFloor }) {
  const floorLevels = ['-1', '0', '1'];
  
  const getWallsForFloor = (floor) => {
    if (floor === '0') {
      return [
        { x1: 0, y1: 0, x2: 1920, y2: 0 },
        { x1: 0, y1: 1080, x2: 1920, y2: 1080 },
        { x1: 0, y1: 0, x2: 0, y2: 1080 },
        { x1: 1920, y1: 0, x2: 1920, y2: 1080 },
        { x1: 0, y1: 450, x2: 150, y2: 450 }, { x1: 250, y1: 450, x2: 550, y2: 450 }, { x1: 650, y1: 450, x2: 950, y2: 450 }, { x1: 1050, y1: 450, x2: 1350, y2: 450 }, { x1: 1450, y1: 450, x2: 1750, y2: 450 }, { x1: 1850, y1: 450, x2: 1920, y2: 450 },
        { x1: 0, y1: 650, x2: 150, y2: 650 }, { x1: 250, y1: 650, x2: 550, y2: 650 }, { x1: 650, y1: 650, x2: 950, y2: 650 }, { x1: 1050, y1: 650, x2: 1350, y2: 650 }, { x1: 1450, y1: 650, x2: 1750, y2: 650 }, { x1: 1850, y1: 650, x2: 1920, y2: 650 },
        { x1: 400, y1: 0, x2: 400, y2: 450 }, { x1: 800, y1: 0, x2: 800, y2: 450 }, { x1: 1200, y1: 0, x2: 1200, y2: 450 }, { x1: 1600, y1: 0, x2: 1600, y2: 450 },
        { x1: 400, y1: 650, x2: 400, y2: 1080 }, { x1: 800, y1: 650, x2: 800, y2: 1080 }, { x1: 1200, y1: 650, x2: 1200, y2: 1080 }, { x1: 1600, y1: 650, x2: 1600, y2: 1080 }
      ];
    } else if (floor === '1') {
      return [
        { x1: 0, y1: 0, x2: 1920, y2: 0 },
        { x1: 0, y1: 0, x2: 0, y2: 1080 },
        { x1: 1920, y1: 0, x2: 1920, y2: 450 },
        { x1: 1920, y1: 450, x2: 1920, y2: 650 }, 
        { x1: 0, y1: 1080, x2: 400, y2: 1080 },
        { x1: 400, y1: 650, x2: 400, y2: 1080 }, 
        { x1: 0, y1: 450, x2: 150, y2: 450 }, { x1: 250, y1: 450, x2: 550, y2: 450 }, { x1: 650, y1: 450, x2: 950, y2: 450 }, { x1: 1050, y1: 450, x2: 1350, y2: 450 }, { x1: 1450, y1: 450, x2: 1750, y2: 450 }, { x1: 1850, y1: 450, x2: 1920, y2: 450 },
        { x1: 0, y1: 650, x2: 150, y2: 650 }, { x1: 250, y1: 650, x2: 1920, y2: 650 }, 
        { x1: 400, y1: 0, x2: 400, y2: 450 }, { x1: 800, y1: 0, x2: 800, y2: 450 }, { x1: 1200, y1: 0, x2: 1200, y2: 450 }, { x1: 1600, y1: 0, x2: 1600, y2: 450 }
      ];
    } else if (floor === '-1') {
      return [
        { x1: 400, y1: 0, x2: 1200, y2: 0 },
        { x1: 400, y1: 0, x2: 400, y2: 450 },
        { x1: 1200, y1: 0, x2: 1200, y2: 450 },
        { x1: 400, y1: 450, x2: 550, y2: 450 }, { x1: 650, y1: 450, x2: 950, y2: 450 }, { x1: 1050, y1: 450, x2: 1600, y2: 450 },
        { x1: 400, y1: 650, x2: 1600, y2: 650 },
        { x1: 400, y1: 450, x2: 400, y2: 650 },
        { x1: 1600, y1: 450, x2: 1600, y2: 650 },
        { x1: 800, y1: 0, x2: 800, y2: 450 }
      ];
    }
    return [];
  };

  return (
    <group>
      <mesh position={[0, -1200, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8000, 8000]} />
        <meshStandardMaterial color="#E8EAED" roughness={1} />
      </mesh>
      
      {floorLevels.map(floor => {
         const yOffset = Y_OFFSETS[floor];
         const isActive = floor === String(activeFloor);
         const floorWalls = getWallsForFloor(floor);
         
         return (
           <group key={floor} position={[0, yOffset, 0]}>
             <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
               <planeGeometry args={[1920, 1080]} />
               <meshStandardMaterial color={isActive ? "#f8f9fa" : "#bcc1c6"} transparent opacity={isActive ? 1 : 0.05} roughness={0.9} />
             </mesh>
             {floorWalls.map((w, id) => {
               const dx = w.x2 - w.x1;
               const dy = w.y2 - w.y1;
               const length = Math.hypot(dx, dy);
               const midX = (w.x1 + w.x2) / 2 + OFFSET_X;
               const midZ = (w.y1 + w.y2) / 2 + OFFSET_Z;
               const angle = Math.atan2(dy, dx);
               return (
                 <mesh key={id} position={[midX, (WALL_HEIGHT * (isActive ? 1 : 0.2)) / 2, midZ]} rotation={[0, -angle, 0]} castShadow={isActive} receiveShadow>
                   <boxGeometry args={[length + WALL_THICKNESS, Math.max(1, WALL_HEIGHT * (isActive ? 1 : 0.2)), WALL_THICKNESS]} />
                   <meshStandardMaterial color="#ffffff" transparent opacity={isActive ? 1 : 0.15} roughness={0.5} />
                 </mesh>
               );
             })}
             
             {/* Floor Label Text in 3D Space */}
             <Text
                position={[0, 0, -650]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={80}
                color={isActive ? '#4285F4' : '#9aa0a6'}
                fillOpacity={isActive ? 1 : 0.3}
                anchorX="center"
                anchorY="middle"
                fontWeight={800}
             >
                {floor === '-1' ? 'Ground Floor' : floor === '0' ? 'First Floor' : 'Second Floor'}
             </Text>
           </group>
         );
      })}
    </group>
  );
}

function DepartmentLabels({ nodesData, activeFloor }) {
  const visibleNodes = nodesData.filter(n => 
    n.Type !== 'Junction' && 
    String(n.Floor) === String(activeFloor)
  );
  
  return (
    <group>
      {visibleNodes.map((n, idx) => {
        const pos = svgToWorld(n.X, n.Y, 25, String(n.Floor));
        let icon = "room";
        let color = "#4285F4";
        
        if (n.Type === 'Washroom') { icon = "wc"; color = "#607d8b"; }
        else if (n.Type === 'Elevator') { icon = "elevator"; color = "#795548"; }
        else if (n.Type === 'Stairs') { icon = "stairs"; color = "#9e9e9e"; }
        else if (n.Type === 'Cafeteria') { icon = "restaurant"; color = "#F57C00"; }
        else if (n.Type === 'Library') { icon = "local_library"; color = "#34A853"; }
        else if (n.Type === 'Office') { icon = "work"; color = "#8E24AA"; }
        else if (n.Type === 'Hall') { icon = "stadium"; color = "#FABC04"; }
        else if (n.Type === 'Classroom') { icon = "school"; color = "#0F9D58"; }
        else if (n.Type === 'Lab') { icon = "science"; color = "#DB4437"; }
        else if (n.Type === 'Server') { icon = "dns"; color = "#3F51B5"; }

        return (
          <Html key={idx} position={pos} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              transform: 'translateY(-50%)',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '2px solid white'
              }}>
                <span className="material-symbols-outlined filled" style={{ color: 'white', fontSize: '16px' }}>
                  {icon}
                </span>
              </div>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 8px', borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)'
              }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3c4043', whiteSpace: 'nowrap' }}>
                  {n.Name}
                </span>
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function NavigationRoute({ activeRoute, livePosition, displayHeading, activeFloor }) {
  const tubeGeometries = useMemo(() => {
    if (!activeRoute || activeRoute.points.length < 2) return [];
    
    const floorPaths = [];
    let currentPath = [];
    
    for (let i = 0; i < activeRoute.points.length; i++) {
       if (String(activeRoute.pathNodes[i].Floor) === String(activeFloor)) {
           currentPath.push(activeRoute.points[i]);
       } else {
           if (currentPath.length > 1) floorPaths.push(currentPath);
           currentPath = [];
       }
    }
    if (currentPath.length > 1) floorPaths.push(currentPath);

    return floorPaths.map(path => {
      const curve = new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.1);
      return new THREE.TubeGeometry(curve, 128, 7, 8, false);
    });
  }, [activeRoute, activeFloor]);

  if (!activeRoute || activeRoute.points.length < 2) return null;
  const destPoint = activeRoute.points[activeRoute.points.length - 1];
  const destNode = activeRoute.pathNodes[activeRoute.pathNodes.length - 1];
  const isDestOnFloor = String(destNode.Floor) === String(activeFloor);

  return (
    <group>
      {tubeGeometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom} position={[0, 8, 0]} renderOrder={9998}>
          <meshBasicMaterial color="#1a73e8" depthTest={false} depthWrite={false} />
        </mesh>
      ))}

      {isDestOnFloor && (
        <group position={[destPoint.x, (Y_OFFSETS[String(activeFloor)] || 0) + 25, destPoint.z]} renderOrder={10000}>
          {/* Red Pin Core */}
          <mesh rotation={[Math.PI, 0, 0]} position={[0, 0, 0]} renderOrder={10000}>
            <coneGeometry args={[12, 24, 32]} />
            <meshBasicMaterial color="#EA4335" depthTest={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, 12, 0]} renderOrder={10000}>
            <sphereGeometry args={[12, 32, 32]} />
            <meshBasicMaterial color="#EA4335" depthTest={false} depthWrite={false} />
          </mesh>
          {/* White Pin Outline */}
          <mesh rotation={[Math.PI, 0, 0]} position={[0, 1, 0]} renderOrder={9999}>
            <coneGeometry args={[14, 26, 32]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
          </mesh>
          <mesh position={[0, 12, 0]} renderOrder={9999}>
            <sphereGeometry args={[14, 32, 32]} />
            <meshBasicMaterial color="#ffffff" depthTest={false} depthWrite={false} />
          </mesh>
        </group>
      )}

      {livePosition && (!livePosition.floor || String(livePosition.floor) === String(activeFloor)) && (() => {
        const blueShape = new THREE.Shape();
        blueShape.moveTo(22, 0); // Tip
        blueShape.lineTo(-12, -15); // Right back
        blueShape.lineTo(-4, 0); // Inner notch
        blueShape.lineTo(-12, 15); // Left back
        blueShape.lineTo(22, 0);

        const extrudeSettings = {
          depth: 3.5,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 1,
          bevelThickness: 1
        };

        return (
          <group position={[livePosition.x, (Y_OFFSETS[String(activeFloor)] || 0) + 12, livePosition.z]} renderOrder={10001}>
            {/* White halo base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10001}>
              <circleGeometry args={[26, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthTest={false} depthWrite={false} />
            </mesh>
            
            {/* True 3D Extruded Blue Chevron */}
            <group rotation={[0, -THREE.MathUtils.degToRad(isNaN(displayHeading) ? 0 : displayHeading), 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 3, 0]} renderOrder={10002}>
                <extrudeGeometry args={[blueShape, extrudeSettings]} />
                <meshBasicMaterial color="#1a73e8" depthTest={false} depthWrite={false} />
              </mesh>
            </group>
          </group>
        );
      })()}
    </group>
  );
}

function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor, cameraAnimation, setCameraAnimation }) {
  // Snap camera once when floor changes when not tracking
  useEffect(() => {
    if (controlsRef.current && !isTracking) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  }, [activeFloor, isTracking, controlsRef]);

  useFrame((state) => {
    if (controlsRef.current) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;

      if (isTracking && livePosition && displayHeading !== undefined) {
        controlsRef.current.target.lerp(new THREE.Vector3(livePosition.x, targetY, livePosition.z), 0.05);
        
        const rad = THREE.MathUtils.degToRad(displayHeading);
        const forwardX = Math.cos(rad);
        const forwardZ = Math.sin(rad);

        // Closer 3D isometric follow view (focused on avatar and immediate corridor/rooms)
        const camDistance = 300;
        const camHeight = 220;
        const idealCameraPos = new THREE.Vector3(
          livePosition.x - forwardX * camDistance, 
          targetY + camHeight, 
          livePosition.z - forwardZ * camDistance
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
}

export default function Navigate({ setActiveTab, currentLocation, destination, setDestination, pendingTransition, setPendingTransition }) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [cameraAnimation, setCameraAnimation] = useState(null);
  const [nodesData, setNodesData] = useState([]);
  const [graphData, setGraphData] = useState({});
  const { steps, setSteps, rawStepEvent, heading, isTracking, startTracking, stopTracking, resetSteps } = usePDR();
  const [livePosition, setLivePosition] = useState(null);
  const [currentPathAngle, setCurrentPathAngle] = useState(0);
  const [compassOffset, setCompassOffset] = useState(null);
  const [activeBuilding] = useState('ramanujan');
  const [activeFloor, setActiveFloor] = useState('-1');
  const [isAccessible, setIsAccessible] = useState(false);
  const [isWrongWay, setIsWrongWay] = useState(false);
  const [hasAnnouncedArrival, setHasAnnouncedArrival] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const controlsRef = useRef();
  const lastSpokenRef = useRef({ text: '', timestamp: 0 });
  const announcedStagesRef = useRef({});
  const completedTransitionsRef = useRef({});

  const speakVoice = useCallback((text, force = false) => {
    if (isVoiceMuted) return;
    if (!('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!force && lastSpokenRef.current.text === text && (now - lastSpokenRef.current.timestamp) < 5000) {
      return;
    }
    lastSpokenRef.current = { text, timestamp: now };

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira'))) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error", e);
    }
  }, [isVoiceMuted]);

  const handleCompleteTransition = useCallback(() => {
    if (!pendingTransition) return;
    const { transitionIndex, destFloor, type } = pendingTransition;

    completedTransitionsRef.current[transitionIndex] = true;
    setActiveFloor(destFloor);
    setCompassOffset(null);
    setIsWrongWay(false);

    if (activeRoute && activeRoute.points[transitionIndex + 1]) {
      const p = activeRoute.points[transitionIndex + 1].clone();
      p.floor = destFloor;
      setLivePosition(p);
    }

    const floorName = destFloor === '0' ? '1st Floor' : destFloor === '1' ? '2nd Floor' : 'Ground Floor';
    speakVoice(`You are on ${floorName}. Exit ${type === 'Lift' ? 'the elevator' : 'the stairs'} and follow the path.`);
    if (setPendingTransition) setPendingTransition(null);
  }, [pendingTransition, activeRoute, setPendingTransition, speakVoice]);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const nodes = await getNodes();
        const edges = await getEdges();
        
        const g = {};
        nodes.forEach(n => g[n.NodeID] = {});
        edges.forEach(e => {
          if (g[e.StartNodeID] && g[e.EndNodeID]) {
            g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
            g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
          }
        });

        setNodesData(nodes);
        setGraphData(g);
      } catch (err) {
        console.error("Error loading graph data", err);
      }
    };
    fetchGraph();
  }, []);

  // --- Step tracking along planned path ---
  useEffect(() => {
    if (!activeRoute || activeRoute.points.length < 2) return;
    
    const STEP_LENGTH = PIXELS_PER_STEP; 
    let distanceToTravel = steps * STEP_LENGTH;
    const points = activeRoute.points;
    const pathNodes = activeRoute.pathNodes;
    
    let newPos = points[0].clone();
    let currentDir = new THREE.Vector3(1, 0, 0);
    let floorOfPosition = String(pathNodes[0].Floor);

    const safeNormalize = (p2, p1, fallback) => {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      return dir.lengthSq() > 0 ? dir.normalize() : fallback.clone();
    };

    let cumDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const n1 = pathNodes[i];
      const n2 = pathNodes[i + 1];

      let segmentLogicalDist = Math.hypot(p2.x - p1.x, p2.z - p1.z); 

      if (n1.Floor !== n2.Floor) {
        segmentLogicalDist = (n1.Type === 'Elevator') ? 0 : 75;

        // If user has reached this transition point and hasn't confirmed arrival on destination floor yet:
        if (!completedTransitionsRef.current[i]) {
          const transType = (n1.Type === 'Elevator') ? 'Lift' : 'Stairs';
          if (!pendingTransition) {
            setPendingTransition({
              type: transType,
              currentFloor: String(n1.Floor),
              destFloor: String(n2.Floor),
              nodeName: n1.Name,
              destNodeName: n2.Name,
              transitionIndex: i
            });
            speakVoice(`You have reached ${n1.Name}. Please take the ${transType.toLowerCase()} to ${n2.Floor === '0' ? '1st Floor' : n2.Floor === '1' ? '2nd Floor' : 'Ground Floor'}.`, true);
          }
          newPos = p1.clone();
          newPos.floor = String(n1.Floor);
          setLivePosition(newPos);
          if (activeFloor !== String(n1.Floor)) setActiveFloor(String(n1.Floor));
          return;
        }
      }

      if (distanceToTravel > segmentLogicalDist && segmentLogicalDist > 0) {
        distanceToTravel -= segmentLogicalDist;
        newPos = p2.clone();
        
        if (n1.Floor !== n2.Floor) {
           floorOfPosition = String(n2.Floor);
        }
        currentDir = safeNormalize(p2, p1, currentDir);
      } else if (segmentLogicalDist === 0) {
        newPos = p2.clone();
        if (n1.Floor !== n2.Floor) {
           floorOfPosition = String(n2.Floor);
           if (i + 1 < points.length - 1) {
             currentDir = safeNormalize(points[i + 2], points[i + 1], currentDir);
           }
        }
      } else {
        const fraction = distanceToTravel / segmentLogicalDist;
        newPos = new THREE.Vector3().lerpVectors(p1, p2, fraction);
        
        currentDir = safeNormalize(p2, p1, currentDir);
        
        if (n1.Floor !== n2.Floor && fraction > 0.5) {
           floorOfPosition = String(n2.Floor);
        } else if (n1.Floor !== n2.Floor && fraction <= 0.5) {
           floorOfPosition = String(n1.Floor);
        }
        
        distanceToTravel = 0;
        break;
      }
      cumDist += segmentLogicalDist;
    }
    
    newPos.floor = floorOfPosition;
    setLivePosition(newPos);
    if (floorOfPosition !== activeFloor) setActiveFloor(floorOfPosition);

    if (currentDir.x !== 0 || currentDir.z !== 0) {
      if (Math.abs(currentDir.y) < 0.9) {
        const angleRad = Math.atan2(currentDir.z, currentDir.x);
        let angleDeg = (angleRad * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;
        setCurrentPathAngle(angleDeg);
      }
    }
  }, [steps, activeRoute, pendingTransition]);

  // --- Step validation with Compass Heading ---
  useEffect(() => {
    if (!rawStepEvent || !isTracking) return;

    let offset = compassOffset;
    if (offset === null) {
      offset = currentPathAngle - heading;
      setCompassOffset(offset);
    }

    let normalizedHeading = (heading + offset) % 360;
    if (normalizedHeading < 0) normalizedHeading += 360;

    let diff = Math.abs(normalizedHeading - currentPathAngle);
    if (diff > 180) diff = 360 - diff;

    if (diff <= 60) {
      setSteps(prev => prev + 1);
    } else if (diff >= 120) {
      setSteps(prev => Math.max(0, prev - 1));
    }
  }, [rawStepEvent]);

  // --- Wrong Direction detection ---
  useEffect(() => {
    if (!isTracking) {
      setIsWrongWay(false);
      return;
    }
    if (compassOffset === null) return;

    let normalizedHeading = (heading + compassOffset) % 360;
    if (normalizedHeading < 0) normalizedHeading += 360;

    let diff = Math.abs(normalizedHeading - currentPathAngle);
    if (diff > 180) diff = 360 - diff;

    setIsWrongWay(diff > 60);
  }, [heading, compassOffset, currentPathAngle, isTracking]);

  // --- Voice prompts for wrong direction and arrival ---
  useEffect(() => {
    if (isWrongWay && isTracking) {
      speakVoice("You are heading in the wrong direction. Please turn around.");
    }
  }, [isWrongWay, isTracking, speakVoice]);

  useEffect(() => {
    if (!isTracking || !activeRoute) return;

    const remaining = Math.ceil(activeRoute.walkingDistance / PIXELS_PER_STEP) - steps;
    if (remaining <= 0 && !hasAnnouncedArrival) {
      setHasAnnouncedArrival(true);
      speakVoice(`Destination reached. You have arrived at ${destination || 'your destination'}.`, true);
    }
  }, [isTracking, steps, activeRoute, destination, hasAnnouncedArrival, speakVoice]);

  // --- Turn-by-Turn Spoken Guidance as user walks along the path ---
  useEffect(() => {
    if (!isTracking || !activeRoute || isVoiceMuted) return;
    if (!activeRoute.maneuvers || activeRoute.maneuvers.length === 0) return;

    const STEP_LENGTH = PIXELS_PER_STEP;
    const traveledDist = Math.max(0, steps * STEP_LENGTH);
    const maneuvers = activeRoute.maneuvers;

    // Find next upcoming maneuver ahead of current traveled distance
    const upcomingIdx = maneuvers.findIndex(m => m.distFromStart > traveledDist + (PIXELS_PER_METER * 0.5));
    const targetManeuver = upcomingIdx !== -1 ? maneuvers[upcomingIdx] : maneuvers[maneuvers.length - 1];
    if (!targetManeuver) return;

    const distToTurn = Math.max(0, targetManeuver.distFromStart - traveledDist);
    const metersToTurn = Math.round(distToTurn / PIXELS_PER_METER);
    const mId = targetManeuver.id;

    if (!announcedStagesRef.current[mId]) {
      announcedStagesRef.current[mId] = {};
    }

    // 1. Advance warning (6 - 15 meters before turn)
    if (metersToTurn <= 15 && metersToTurn > 3 && !announcedStagesRef.current[mId].advance) {
      announcedStagesRef.current[mId].advance = true;
      speakVoice(`In ${metersToTurn} meters, ${targetManeuver.speech}.`);
    }

    // 2. Immediate action at the turn (within 3 meters)
    if (metersToTurn <= 3 && !announcedStagesRef.current[mId].turn) {
      announcedStagesRef.current[mId].turn = true;
      speakVoice(targetManeuver.speech.charAt(0).toUpperCase() + targetManeuver.speech.slice(1) + ".");
    }
  }, [isTracking, steps, activeRoute, isVoiceMuted, speakVoice]);

  const calculateRoute = useCallback(() => {
    if (!currentLocation || !destination || nodesData.length === 0) return;

    const safeCompare = (val1, val2) => {
      if (!val1 || !val2) return false;
      return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
    };

    const startNode = nodesData.find(n => safeCompare(n.Name, currentLocation) || safeCompare(n.NodeID, currentLocation));
    const endNode = nodesData.find(n => safeCompare(n.Name, destination) || safeCompare(n.NodeID, destination));

    if (!startNode || !endNode) return;

    if (startNode.NodeID === endNode.NodeID) {
      setActiveRoute(null);
      return;
    }

    setActiveFloor(String(startNode.Floor));

    const result = runDijkstra(startNode.NodeID, endNode.NodeID, nodesData, graphData, isAccessible);

    if (result) {
      let pathIDs = result.pathNodeIDs;
      let totalDist = result.totalDistance;

      if (pathIDs.length >= 2) {
        const lastNode = nodesData.find(n => n.NodeID === pathIDs[pathIDs.length - 1]);
        const prevNode = nodesData.find(n => n.NodeID === pathIDs[pathIDs.length - 2]);
        
        if (lastNode && prevNode && lastNode.Type !== 'Junction' && prevNode.Type === 'Junction') {
          pathIDs.pop();
          const edgeDist = graphData[prevNode.NodeID] && graphData[prevNode.NodeID][lastNode.NodeID] ? graphData[prevNode.NodeID][lastNode.NodeID].distance : 0;
          totalDist -= edgeDist;
        }
      }

      const points = pathIDs.map(id => {
        const n = nodesData.find(node => node.NodeID === id);
        return new THREE.Vector3(...svgToWorld(n.X, n.Y, 0, n.Floor)); 
      });
      const pathNodes = pathIDs.map(id => nodesData.find(node => node.NodeID === id));

      let walkingDistance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const n1 = pathNodes[i];
        const n2 = pathNodes[i + 1];
        
        if (n1.Floor !== n2.Floor) {
          if (n1.Type === 'Elevator' && n2.Type === 'Elevator') {
             walkingDistance += 0;
          } else if (n1.Type === 'Stairs' && n2.Type === 'Stairs') {
             walkingDistance += 75;
          }
        } else {
          walkingDistance += Math.hypot(p2.x - p1.x, p2.z - p1.z);
        }
      }
      
      const maneuvers = calculateManeuvers(points, pathNodes);
      setActiveRoute({ points, pathNodes, maneuvers, distance: totalDist, walkingDistance });
      const p0 = points[0].clone();
      p0.floor = String(pathNodes[0].Floor);
      setLivePosition(p0);
      resetSteps();
      setHasAnnouncedArrival(false);
      completedTransitionsRef.current = {};
      if (setPendingTransition) setPendingTransition(null);
    } else {
      alert("No route found. Try disabling accessibility mode if you must use stairs.");
    }
  }, [currentLocation, destination, nodesData, graphData, isAccessible]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  // Live turn-by-turn navigation state
  const currentNavState = useMemo(() => {
    if (!activeRoute || !activeRoute.maneuvers || activeRoute.maneuvers.length === 0) {
      return null;
    }

    const STEP_LENGTH = PIXELS_PER_STEP;
    const traveledDist = Math.max(0, steps * STEP_LENGTH);
    const totalDist = activeRoute.walkingDistance;
    const remainingDist = Math.max(0, totalDist - traveledDist);

    // Find first maneuver whose distFromStart is ahead of current traveledDist
    const upcomingIdx = activeRoute.maneuvers.findIndex(m => m.distFromStart > traveledDist + (PIXELS_PER_METER * 0.5));
    const activeManeuver = upcomingIdx !== -1 ? activeRoute.maneuvers[upcomingIdx] : activeRoute.maneuvers[activeRoute.maneuvers.length - 1];
    const nextManeuver = upcomingIdx !== -1 && upcomingIdx + 1 < activeRoute.maneuvers.length 
      ? activeRoute.maneuvers[upcomingIdx + 1] 
      : null;

    const distToTurn = Math.max(0, (activeManeuver?.distFromStart || 0) - traveledDist);
    const metersToTurn = Math.round(distToTurn / PIXELS_PER_METER);
    const remainingMeters = Math.round(remainingDist / PIXELS_PER_METER);
    const remainingMinutes = Math.max(1, Math.round(remainingMeters / 50));
    const remainingSteps = Math.max(0, Math.ceil(remainingDist / PIXELS_PER_STEP));

    return {
      activeManeuver,
      nextManeuver,
      metersToTurn,
      remainingMeters,
      remainingMinutes,
      remainingSteps,
      traveledDist
    };
  }, [activeRoute, steps]);

  const handleStartNavigation = () => {
    setCompassOffset(null);
    if (!activeRoute || !activeRoute.points || activeRoute.points.length === 0) return;
    
    const targetY = Y_OFFSETS[String(activeFloor)] || 0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    activeRoute.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });
    
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const routeLengthX = maxX - minX;
    const routeLengthZ = maxZ - minZ;
    const maxDim = Math.max(routeLengthX, routeLengthZ, 600);
    const zoomDistance = maxDim * 1.1; 

    setCameraAnimation({
      target: new THREE.Vector3(centerX, targetY, centerZ),
      position: new THREE.Vector3(centerX, targetY + zoomDistance, centerZ + zoomDistance * 0.7)
    });
  };

  const handleStartTracking = async () => {
    setCompassOffset(null);
    resetSteps();
    setHasAnnouncedArrival(false);
    announcedStagesRef.current = {};
    completedTransitionsRef.current = {};
    if (setPendingTransition) setPendingTransition(null);
    await startTracking();
    if (activeRoute && destination) {
      const firstM = activeRoute.maneuvers?.[0];
      const initialPrompt = firstM 
        ? `Starting navigation to ${destination}. ${firstM.speech.charAt(0).toUpperCase() + firstM.speech.slice(1)}.`
        : `Starting navigation to ${destination}. Head forward along the corridor.`;
      speakVoice(initialPrompt, true);
    }
  };

  const handleStopTracking = () => {
    stopTracking();
    resetSteps();
    setCompassOffset(null);
    setIsWrongWay(false);
    setHasAnnouncedArrival(false);
    completedTransitionsRef.current = {};
    if (setPendingTransition) setPendingTransition(null);
  };

  const handleEmergency = () => {
    if (!currentLocation) {
      alert("Please scan your current location first (Scan QR)!");
      return;
    }
    const safeCompare = (val1, val2) => {
      if (!val1 || !val2) return false;
      return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
    };

    const startNode = nodesData.find(n => safeCompare(n.Name, currentLocation) || safeCompare(n.NodeID, currentLocation));
    if (!startNode) {
      alert("Current location node not found in map data.");
      return;
    }

    // Find all emergency exits
    const exits = nodesData.filter(n => 
      n.Type === 'Exit' || 
      (n.Name && (n.Name.toLowerCase().includes('exit') || n.Name.toLowerCase().includes('fire') || n.Name.toLowerCase().includes('main door')))
    );

    if (exits.length === 0) {
      alert("No emergency exits found in the database. Please name a node 'Exit' or 'Fire Exit'.");
      return;
    }

    let nearestExit = null;
    let minDistance = Infinity;

    exits.forEach(exit => {
      const result = runDijkstra(startNode.NodeID, exit.NodeID, nodesData, graphData, false);
      if (result && result.totalDistance < minDistance) {
        minDistance = result.totalDistance;
        nearestExit = exit;
      }
    });

    if (nearestExit) {
      setHasAnnouncedArrival(false);
      setDestination(nearestExit.Name || nearestExit.NodeID);
      speakVoice(`Emergency evacuation activated. Route set to nearest exit: ${nearestExit.Name}.`, true);
    } else {
      alert("No valid route to an emergency exit found!");
    }
  };

  const getDistanceDisplay = () => {
    if (!activeRoute) return "Route not started";
    const meters = Math.round(activeRoute.walkingDistance / PIXELS_PER_METER);
    const mins = Math.max(1, Math.round(meters / 50)); 
    return `${meters}m (Approx. ${mins} min)`;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>
      
      {/* Route Planner Card (Clean Old Working Version) */}
      {!isTracking && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          borderRadius: '16px',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#3c4043', fontWeight: 800 }}>Route Planner</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Emergency Exit Button */}
              <button
                type="button"
                onClick={handleEmergency}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '34px',
                  padding: '0 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'white',
                  background: '#EA4335',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid #EA4335',
                  boxShadow: '0 2px 4px rgba(234, 67, 53, 0.25)',
                  boxSizing: 'border-box'
                }}
                title="Navigate to nearest Emergency Exit"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span>
                Emergency
              </button>

              {/* Avoid Stairs Checkbox */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '34px',
                padding: '0 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: isAccessible ? '#174ea6' : '#1967d2',
                background: isAccessible ? '#d2e3fc' : '#e8f0fe',
                borderRadius: '10px',
                cursor: 'pointer',
                border: '1px solid #d2e3fc',
                boxSizing: 'border-box',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={isAccessible}
                  onChange={(e) => setIsAccessible(e.target.checked)}
                  style={{ cursor: 'pointer', margin: 0, accentColor: '#1a73e8' }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span>
                Avoid Stairs
              </label>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="search-bar" style={{ padding: '8px 16px', background: '#f1f3f4', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined filled" style={{ color: '#4285F4' }}>my_location</span>
              <input type="text" value={currentLocation || "Location not set (Scan QR)"} readOnly style={{ fontWeight: 500, background: 'transparent', width: '100%', color: '#3c4043', border: 'none', outline: 'none' }} />
            </div>
            <div className="search-bar" style={{ padding: '8px 16px', background: '#f1f3f4', border: 'none', position: 'relative', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined filled" style={{ color: '#EA4335' }}>location_on</span>
              <select 
                value={destination || ''} 
                onChange={(e) => {
                  setDestination(e.target.value);
                  setHasAnnouncedArrival(false);
                }}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontWeight: 500, color: '#3c4043', fontSize: '1rem', appearance: 'none', cursor: 'pointer', width: '100%' }}
              >
                <option value="" disabled>Choose destination...</option>
                {nodesData
                  .filter(n => n.Type !== 'Junction' && n.Type !== 'Door')
                  .sort((a, b) => a.Name.localeCompare(b.Name))
                  .map(node => (
                    <option key={node.NodeID} value={node.Name}>
                      {node.Name} {node.Floor === '0' ? '(F1)' : node.Floor === '1' ? '(F2)' : '(G)'}
                    </option>
                  ))}
              </select>
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: '#5f6368' }}>arrow_drop_down</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
             <span style={{ fontWeight: 600, color: activeRoute ? '#34a853' : '#5f6368' }}>
               {getDistanceDisplay()}
             </span>
             <div style={{ display: 'flex', gap: '8px' }}>
               {activeRoute && !isTracking && (
                 <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', background: '#4285F4', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleStartTracking}>
                   <span className="material-symbols-outlined">navigation</span> Start
                 </button>
               )}
               {!isTracking && (
                 <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', cursor: 'pointer' }} onClick={handleStartNavigation}>
                   <span className="material-symbols-outlined">route</span> Map
                 </button>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Google Maps Style Navigation Header Bar */}
      {isTracking && currentNavState?.activeManeuver && !hasAnnouncedArrival && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          maxWidth: '460px',
          margin: '0 auto',
          background: '#137333',
          color: 'white',
          borderRadius: '18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Main Maneuver Strip */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 18px', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>
                {currentNavState.activeManeuver.icon || 'straight'}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.15 }}>
                {currentNavState.metersToTurn > 0 ? `${currentNavState.metersToTurn} m` : 'Turn now'}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#e8f5e9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                {currentNavState.activeManeuver.instruction}
              </div>
            </div>

            {/* Voice Mute / Unmute Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isVoiceMuted;
                setIsVoiceMuted(next);
                if (!next) speakVoice("Voice navigation enabled.");
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isVoiceMuted ? 'rgba(234, 67, 53, 0.45)' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={isVoiceMuted ? 'Unmute Voice Guidance' : 'Mute Voice Guidance'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                {isVoiceMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>
          </div>

          {/* Secondary "Then" Turn Strip (Google Maps style) */}
          {currentNavState.nextManeuver && (
            <div style={{
              background: '#0d5524',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#c8e6c9'
            }}>
              <span style={{ opacity: 0.85, fontWeight: 500 }}>Then</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#c8e6c9' }}>
                {currentNavState.nextManeuver.icon || 'straight'}
              </span>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentNavState.nextManeuver.instruction}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floor Switcher */}
      <div style={{ 
        position: 'absolute', 
        right: '16px', 
        top: isTracking ? (currentNavState?.nextManeuver ? '150px' : '110px') : '320px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        zIndex: 1000 
      }}>
        {/* Building Icon Header */}
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: 'white',
          color: '#5f6368',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'default'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>apartment</span>
        </div>

        {/* Floor Buttons: G, F1, F2 */}
        <button 
          onClick={() => setActiveFloor('-1')} 
          style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            background: activeFloor === '-1' ? '#1a73e8' : 'white', 
            color: activeFloor === '-1' ? 'white' : '#5f6368', 
            border: 'none', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          G
        </button>
        <button 
          onClick={() => setActiveFloor('0')} 
          style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            background: activeFloor === '0' ? '#1a73e8' : 'white', 
            color: activeFloor === '0' ? 'white' : '#5f6368', 
            border: 'none', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          F1
        </button>
        <button 
          onClick={() => setActiveFloor('1')} 
          style={{ 
            width: '45px', 
            height: '45px', 
            borderRadius: '50%', 
            background: activeFloor === '1' ? '#1a73e8' : 'white', 
            color: activeFloor === '1' ? 'white' : '#5f6368', 
            border: 'none', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          F2
        </button>
      </div>
      
      {/* Wrong Direction Warning Pill */}
      {isWrongWay && isTracking && (
        <div style={{
          position: 'absolute',
          top: currentNavState?.nextManeuver ? '150px' : '110px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#EA4335',
          color: 'white',
          padding: '8px 18px',
          borderRadius: '20px',
          zIndex: 1001,
          fontWeight: 'bold',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 3px 10px rgba(234, 67, 53, 0.4)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
          Wrong Direction!
        </div>
      )}
      
      {/* Active Navigation Card (Steps Remaining / You Have Arrived) */}
      {isTracking && (
        <div style={{
          position: 'absolute',
          bottom: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          color: '#3c4043',
          padding: '12px 22px',
          borderRadius: '16px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          width: '230px',
          textAlign: 'center'
        }}>
          {activeRoute && (currentNavState?.remainingSteps ?? Math.max(0, Math.ceil(activeRoute.walkingDistance / PIXELS_PER_STEP) - steps)) > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#34a853', fontSize: '1.8rem' }}>directions_walk</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34a853' }}>
                  {currentNavState?.remainingSteps ?? Math.max(0, Math.ceil(activeRoute.walkingDistance / PIXELS_PER_STEP) - steps)}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#5f6368' }}>steps</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#5f6368', fontWeight: 500 }}>
                {currentNavState?.remainingMeters || Math.round(activeRoute.walkingDistance / PIXELS_PER_METER)} m · ~{currentNavState?.remainingMinutes || 1} min
              </span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ color: '#EA4335', fontSize: '2rem' }}>location_on</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#34a853', marginTop: '2px' }}>You have arrived!</span>
              <span style={{ fontSize: '0.8rem', color: '#5f6368' }}>Destination reached.</span>
            </>
          )}
          <button
            className="btn-outline"
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '8px 0',
              fontSize: '0.85rem',
              borderRadius: '20px',
              color: '#d93025',
              border: '1.5px solid #d93025',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={handleStopTracking}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span> Exit Navigation
          </button>
        </div>
      )}
      
      {/* Floor Transition Modal (Elevator / Stairs) */}
      {pendingTransition && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(5px)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px 20px',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '350px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Icon Header */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#e8f0fe',
              color: '#1a73e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>
                {pendingTransition.type === 'Lift' ? 'elevator' : 'stairs'}
              </span>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#202124', fontWeight: 800 }}>
              {pendingTransition.type === 'Lift' ? 'Elevator Navigation' : 'Stairs Navigation'}
            </h3>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#5f6368', lineHeight: 1.4 }}>
              Take <strong>{pendingTransition.nodeName}</strong> to{' '}
              <strong style={{ color: '#1a73e8' }}>
                {pendingTransition.destFloor === '0' ? '1st Floor' : pendingTransition.destFloor === '1' ? '2nd Floor' : 'Ground Floor'}
              </strong>.
            </p>

            {/* Floor Badge Card */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '14px',
              padding: '12px 16px',
              border: '1px solid #e8eaed',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 600 }}>CURRENT</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#202124', marginTop: '2px' }}>
                  {pendingTransition.currentFloor === '0' ? '1st Floor' : pendingTransition.currentFloor === '1' ? '2nd Floor' : 'Ground'}
                </div>
              </div>

              <span className="material-symbols-outlined" style={{ color: '#1a73e8', fontSize: '24px' }}>
                arrow_forward
              </span>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 600 }}>DESTINATION</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1a73e8', marginTop: '2px' }}>
                  {pendingTransition.destFloor === '0' ? '1st Floor' : pendingTransition.destFloor === '1' ? '2nd Floor' : 'Ground'}
                </div>
              </div>
            </div>

            {/* Primary Action Button: 1-Tap Continue */}
            <button
              type="button"
              onClick={handleCompleteTransition}
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'white',
                background: '#1a73e8',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)',
                marginBottom: '10px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
              I'm on {pendingTransition.destFloor === '0' ? '1st Floor' : pendingTransition.destFloor === '1' ? '2nd Floor' : 'Ground Floor'}
            </button>

            {/* Secondary Action: Scan QR Code */}
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1a73e8',
                background: 'transparent',
                border: '1.5px solid #d2e3fc',
                borderRadius: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_scanner</span>
              Scan Lift Lobby QR Code
            </button>
          </div>
        </div>
      )}
      
      {/* 3D Map Canvas */}
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 2000, 2000], fov: 45, near: 1, far: 50000 }} dpr={[1, 1]}>
          <fog attach="fog" args={['#E8EAED', 2000, 30000]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[1000, 3000, 1000]} intensity={1.5} color="#fffcf5" />
          
          <React.Suspense fallback={null}>
            <ModelErrorBoundary>
              <RealBuildingModel activeBuilding={activeBuilding} activeFloor={activeFloor} />
            </ModelErrorBoundary>
            <DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />
            <NavigationRoute 
              activeRoute={activeRoute} 
              livePosition={livePosition} 
              displayHeading={compassOffset !== null ? (heading + compassOffset) : currentPathAngle} 
              activeFloor={activeFloor} 
            />
            <CameraController 
              isTracking={isTracking} 
              livePosition={livePosition} 
              controlsRef={controlsRef} 
              displayHeading={compassOffset !== null ? (heading + compassOffset) : currentPathAngle} 
              activeFloor={activeFloor} 
              cameraAnimation={cameraAnimation} 
              setCameraAnimation={setCameraAnimation} 
            />
          </React.Suspense>
          <OrbitControls 
            ref={controlsRef} 
            makeDefault 
            maxPolarAngle={Math.PI / 2.2} 
            minDistance={100} 
            maxDistance={30000} 
            enableDamping 
            dampingFactor={0.05} 
          />
        </Canvas>
      </div>
    </div>
  );
}
