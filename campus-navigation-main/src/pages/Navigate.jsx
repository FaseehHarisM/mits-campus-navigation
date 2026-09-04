import React, { useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getNodes, getEdges } from '../services/api';
import usePDR from '../hooks/usePDR';

const SVG_W = 1920;
const SVG_H = 1080;
const OFFSET_X = -SVG_W / 2;
const OFFSET_Z = -SVG_H / 2;
const WALL_HEIGHT = 35; 
const WALL_THICKNESS = 14;

const Y_OFFSETS = { '-1': -600, '0': 0, '1': 600 };

function svgToWorld(sx, sy, height = 2, floorStr = '0') {
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
                {floor === '0' ? 'Ground Floor' : floor === '1' ? 'First Floor' : 'G Floor (Basement)'}
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
        const pos = svgToWorld(n.X, n.Y, 30, String(n.Floor));
        let icon = "room";
        let color = "#4285F4";
        
        if (n.Type === 'Washroom') { icon = "wc"; color = "#607d8b"; }
        else if (n.Type === 'Elevator') { icon = "elevator"; color = "#795548"; }
        else if (n.Type === 'Stairs') { icon = "stairs"; color = "#9e9e9e"; }
        else if (n.Type === 'Cafeteria') { icon = "restaurant"; color = "#F57C00"; }
        else if (n.Type === 'Library') { icon = "local_library"; color = "#34A853"; }
        else if (n.Type === 'Office') { icon = "work"; color = "#8E24AA"; }
        else if (n.Type === 'Hall') { icon = "stadium"; color = "#FABC04"; }

        return (
          <Html key={idx} position={pos} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              transform: 'translateY(-50%)',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)', border: '2px solid white'
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
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3C4043', whiteSpace: 'nowrap' }}>
                  {n.Name}
                </span>
              </div>
            </div>
          </Html>
        )
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
      return new THREE.TubeGeometry(curve, 128, 10, 8, false);
    });
  }, [activeRoute, activeFloor]);

  if (!activeRoute || activeRoute.points.length < 2) return null;
  const destPoint = activeRoute.points[activeRoute.points.length - 1];
  const destNode = activeRoute.pathNodes[activeRoute.pathNodes.length - 1];
  const isDestOnFloor = String(destNode.Floor) === String(activeFloor);

  return (
    <group>
      {tubeGeometries.map((geom, idx) => (
        <mesh key={idx} geometry={geom} position={[0, 4, 0]}>
          <meshBasicMaterial color="#4285F4" />
        </mesh>
      ))}

      {isDestOnFloor && (
        <group position={[destPoint.x, destPoint.y + 25, destPoint.z]}>
          {/* Red Pin Core */}
          <mesh rotation={[Math.PI, 0, 0]} position={[0, 0, 0]}>
            <coneGeometry args={[12, 24, 32]} />
            <meshBasicMaterial color="#EA4335" />
          </mesh>
          <mesh position={[0, 12, 0]}>
            <sphereGeometry args={[12, 32, 32]} />
            <meshBasicMaterial color="#EA4335" />
          </mesh>
          {/* White Pin Outline */}
          <mesh rotation={[Math.PI, 0, 0]} position={[0, 1, 0]}>
            <coneGeometry args={[14, 26, 32]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 12, 0]}>
            <sphereGeometry args={[14, 32, 32]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {livePosition && (() => {
        const blueShape = new THREE.Shape();
        blueShape.moveTo(25, 0); // Tip
        blueShape.lineTo(-15, -18); // Right back
        blueShape.lineTo(-5, 0); // Inner notch
        blueShape.lineTo(-15, 18); // Left back
        blueShape.lineTo(25, 0);

        const extrudeSettings = {
          depth: 4,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 1.5,
          bevelThickness: 1.5
        };

        return (
          <group position={[livePosition.x, (Y_OFFSETS[String(activeFloor)] || 0) + 16, livePosition.z]}>
            {/* White halo base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[32, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
            
            {/* True 3D Extruded Blue Chevron */}
            <group rotation={[0, -THREE.MathUtils.degToRad(isNaN(displayHeading) ? 0 : displayHeading), 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
                <extrudeGeometry args={[blueShape, extrudeSettings]} />
                <meshBasicMaterial color="#4285F4" />
              </mesh>
            </group>
          </group>
        );
      })()}
    </group>
  );
}

function CameraController({ isTracking, livePosition, controlsRef, displayHeading, activeFloor }) {
  useFrame((state) => {
    if (controlsRef.current) {
      const targetY = Y_OFFSETS[String(activeFloor)] || 0;
      
      if (isTracking && livePosition && displayHeading !== undefined) {
        controlsRef.current.target.lerp(new THREE.Vector3(livePosition.x, targetY, livePosition.z), 0.05);
        
        const rad = THREE.MathUtils.degToRad(displayHeading);
        const idealCameraPos = new THREE.Vector3(
          livePosition.x - Math.cos(rad) * 450, 
          targetY + 350, 
          livePosition.z - Math.sin(rad) * 450
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
}

export default function Navigate({ setActiveTab, currentLocation, destination, setDestination }) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [nodesData, setNodesData] = useState([]);
  const [graphData, setGraphData] = useState({});
  const { steps, setSteps, rawStepEvent, heading, isTracking, startTracking, stopTracking, resetSteps } = usePDR();
  const [livePosition, setLivePosition] = useState(null);
  const [currentPathAngle, setCurrentPathAngle] = useState(0);
  const [compassOffset, setCompassOffset] = useState(null);
  const [activeFloor, setActiveFloor] = useState('0');
  const [isAccessible, setIsAccessible] = useState(false);
  const controlsRef = React.useRef();

  React.useEffect(() => {
    const fetchGraph = async () => {
      try {
        const nodes = await getNodes();
        const edges = await getEdges();
        
        const g = {};
        nodes.forEach(n => g[n.NodeID] = {});
        edges.forEach(e => {
          g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
          g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
        });

        setNodesData(nodes);
        setGraphData(g);
      } catch (err) {
        console.error("Error loading graph data", err);
      }
    };
    fetchGraph();
  }, []);

  React.useEffect(() => {
    if (!activeRoute || activeRoute.points.length < 2) return;
    
    const STEP_LENGTH = 2.0; 
    let distanceToTravel = steps * STEP_LENGTH;
    const points = activeRoute.points;
    const pathNodes = activeRoute.pathNodes;
    
    let newPos = points[0].clone();
    let currentDir = new THREE.Vector3(1, 0, 0);
    let floorOfPosition = activeFloor;

    const safeNormalize = (p2, p1, fallback) => {
      const dir = new THREE.Vector3().subVectors(p2, p1);
      return dir.lengthSq() > 0 ? dir.normalize() : fallback.clone();
    };

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const n1 = pathNodes[i];
      const n2 = pathNodes[i + 1];

      let segmentLogicalDist = Math.hypot(p2.x - p1.x, p2.z - p1.z); 

      if (n1.Floor !== n2.Floor) {
        if (n1.Type === 'Elevator' && n2.Type === 'Elevator') {
          segmentLogicalDist = 0; 
        } else if (n1.Type === 'Stairs' && n2.Type === 'Stairs') {
          segmentLogicalDist = 75; 
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
    }
    
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
  }, [steps, activeRoute]);

  React.useEffect(() => {
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

  const calculateRoute = React.useCallback(() => {
    if (!currentLocation || !destination || nodesData.length === 0) return;

    const safeCompare = (val1, val2) => {
      if (!val1 || !val2) return false;
      return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
    };

    const startNode = nodesData.find(n => safeCompare(n.Name, currentLocation) || safeCompare(n.NodeID, currentLocation));
    const endNode = nodesData.find(n => safeCompare(n.Name, destination) || safeCompare(n.NodeID, destination));

    if (startNode && endNode && startNode.NodeID === endNode.NodeID) {
      setActiveRoute(null);
      return;
    }

    if (!startNode || !endNode) return;

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
          const edgeDist = graphData[prevNode.NodeID][lastNode.NodeID].distance || 0;
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
      
      setActiveRoute({ points, pathNodes, distance: totalDist, walkingDistance });
      setLivePosition(points[0].clone());
      resetSteps();
    } else {
      alert("No route found. Try disabling accessibility mode if you must use stairs.");
    }
  }, [currentLocation, destination, nodesData, graphData, isAccessible]);

  React.useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const handleStartNavigation = () => {
    setCompassOffset(null);
    if (!currentLocation || !destination) {
      alert("Please ensure both current location and destination are set.");
      return;
    }
    calculateRoute();
  };

  const getDistanceDisplay = () => {
    if (!activeRoute) return "Route not started";
    const meters = Math.round(activeRoute.distance / 10);
    const mins = Math.max(1, Math.round(meters / 60)); 
    return `${meters}m (Approx. ${mins} min)`;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>
      
      {!isTracking && (
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', background: 'white', borderRadius: '16px', padding: '16px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#3c4043' }}>Route Planner</h2>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1967d2', background: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isAccessible} onChange={(e) => setIsAccessible(e.target.checked)} style={{ cursor: 'pointer' }} />
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span>
              Avoid Stairs
            </label>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="search-bar" style={{ padding: '8px 16px', background: '#f1f3f4', border: 'none', borderRadius: '8px' }}>
              <span className="material-symbols-outlined filled" style={{ color: '#4285F4' }}>my_location</span>
              <input type="text" value={currentLocation || "Location not set (Scan QR)"} readOnly style={{ fontWeight: 500, background: 'transparent', width: '100%', color: '#3c4043' }} />
            </div>
            <div className="search-bar" style={{ padding: '8px 16px', background: '#f1f3f4', border: 'none', position: 'relative', borderRadius: '8px' }}>
              <span className="material-symbols-outlined filled" style={{ color: '#EA4335' }}>location_on</span>
              <select 
                value={destination || ''} 
                onChange={(e) => setDestination(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontWeight: 500, color: '#3c4043', fontSize: '1rem', appearance: 'none', cursor: 'pointer', width: '100%' }}
              >
                <option value="" disabled>Choose destination...</option>
                {nodesData.filter(n => n.Type !== 'Junction').map(node => (
                  <option key={node.NodeID} value={node.Name}>
                    {node.Name} {node.Floor === '0' ? '(F0)' : node.Floor === '1' ? '(F1)' : '(G)'}
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
                 <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', background: '#4285F4' }} onClick={startTracking}>
                   <span className="material-symbols-outlined">navigation</span> Start
                 </button>
               )}
               {!isTracking && (
                 <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '24px', color: '#4285F4', border: '2px solid #4285F4' }} onClick={handleStartNavigation}>
                   <span className="material-symbols-outlined">route</span> Map
                 </button>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Floor Switcher */}
      <div style={{ position: 'absolute', right: '20px', top: isTracking ? '80px' : '350px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 999 }}>
         <button onClick={() => setActiveFloor('1')} style={{ padding: '12px', background: activeFloor === '1' ? '#1a73e8' : 'white', color: activeFloor === '1' ? 'white' : '#5f6368', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>F1</button>
         <button onClick={() => setActiveFloor('0')} style={{ padding: '12px', background: activeFloor === '0' ? '#1a73e8' : 'white', color: activeFloor === '0' ? 'white' : '#5f6368', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>F0</button>
         <button onClick={() => setActiveFloor('-1')} style={{ padding: '12px', background: activeFloor === '-1' ? '#1a73e8' : 'white', color: activeFloor === '-1' ? 'white' : '#5f6368', border: 'none', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>G</button>
      </div>
      
      {isTracking && (
        <div style={{ position: 'absolute', bottom: '110px', left: '50%', transform: 'translateX(-50%)', background: 'white', color: '#3c4043', padding: '16px 24px', borderRadius: '16px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '220px', textAlign: 'center' }}>
          {activeRoute && Math.ceil(activeRoute.walkingDistance / 2.0) - steps > 0 ? (
            <>
              <span className="material-symbols-outlined" style={{ color: '#34a853', fontSize: '2rem' }}>directions_walk</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#34a853' }}>
                {Math.ceil(activeRoute.walkingDistance / 2.0) - steps}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#5f6368' }}>steps remaining</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ color: '#EA4335', fontSize: '2.5rem' }}>location_on</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34a853', marginTop: '4px' }}>You have arrived!</span>
              <span style={{ fontSize: '0.85rem', color: '#5f6368' }}>Destination reached.</span>
            </>
          )}
          <button className="btn-outline" style={{ marginTop: '16px', width: '100%', padding: '8px', fontSize: '0.9rem', borderRadius: '24px', color: '#d93025', border: '2px solid #d93025' }} onClick={stopTracking}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span> Exit Navigation
          </button>
        </div>
      )}
      
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 2000, 2000], fov: 35, near: 1, far: 10000 }} shadows>
          <fog attach="fog" args={['#E8EAED', 1500, 6000]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[1000, 3000, 1000]} intensity={1.5} color="#fffcf5" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
          
          <React.Suspense fallback={null}>
            <IsometricFloorPlan activeFloor={activeFloor} />
            <DepartmentLabels nodesData={nodesData} activeFloor={activeFloor} />
            <NavigationRoute activeRoute={activeRoute} livePosition={livePosition} displayHeading={compassOffset !== null ? (heading + compassOffset) : currentPathAngle} activeFloor={activeFloor} />
            <CameraController isTracking={isTracking} livePosition={livePosition} controlsRef={controlsRef} displayHeading={compassOffset !== null ? (heading + compassOffset) : currentPathAngle} activeFloor={activeFloor} />
          </React.Suspense>
          <OrbitControls ref={controlsRef} makeDefault maxPolarAngle={Math.PI / 2.2} minDistance={100} maxDistance={6000} enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
    </div>
  );
}
