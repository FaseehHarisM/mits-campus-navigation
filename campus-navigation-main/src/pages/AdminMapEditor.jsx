import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { RealBuildingModel } from '../components/RealBuildingModel';

const OFFSET_X = -1920 / 2;
const OFFSET_Z = -1080 / 2;
const Y_OFFSETS = { '-1': -600, '0': 0, '1': 600 };

function getNodeDegree(nodeId, allEdges) {
  return allEdges.filter(e => e.StartNodeID === nodeId || e.EndNodeID === nodeId).length;
}

function getJunctionBadge(deg) {
  if (deg >= 4) {
    return { label: `✛ ${deg}-Way`, title: `${deg}-Way Crossroad`, bg: '#e6f4ea', color: '#137333', border: '#34a853', sphereColor: '#0f9d58', radius: 75 };
  }
  if (deg === 3) {
    return { label: `┳ 3-Way`, title: '3-Way T-Junction', bg: '#e8f0fe', color: '#1a73e8', border: '#4285f4', sphereColor: '#1a73e8', radius: 68 };
  }
  if (deg === 2) {
    return { label: `━ 2-Way`, title: '2-Way Corridor Turn', bg: '#f1f3f4', color: '#3c4043', border: '#9aa0a6', sphereColor: '#5f6368', radius: 58 };
  }
  if (deg === 1) {
    return { label: `• 1-Way`, title: '1-Way Stub', bg: '#fef7e0', color: '#b06000', border: '#fbbc04', sphereColor: '#f29900', radius: 52 };
  }
  return { label: `⚠ Unlinked`, title: 'Unlinked Node', bg: '#fce8e6', color: '#c5221f', border: '#ea4335', sphereColor: '#d93025', radius: 50 };
}

function EditorEdge({ edge, start, end, activeFloor, toolMode, isConnectedToSelected, onDelete }) {
  const isSameFloor = String(start.Floor) === String(activeFloor) && String(end.Floor) === String(activeFloor);
  const startY = (Y_OFFSETS[String(start.Floor)] ?? 0) + 120;
  const endY = (Y_OFFSETS[String(end.Floor)] ?? 0) + 120;

  const { tubeGeo, lineGeo } = useMemo(() => {
    const p1 = new THREE.Vector3(start.X + OFFSET_X, startY, start.Y + OFFSET_Z);
    const p2 = new THREE.Vector3(end.X + OFFSET_X, endY, end.Y + OFFSET_Z);
    const curve = new THREE.LineCurve3(p1, p2);
    const tubeRadius = isConnectedToSelected ? 18 : 12;
    const tube = new THREE.TubeGeometry(curve, 2, tubeRadius, 8, false);
    const line = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    return { tubeGeo: tube, lineGeo: line };
  }, [start.X, start.Y, start.Floor, end.X, end.Y, end.Floor, startY, endY, isConnectedToSelected]);

  let lineColor = '#d93025'; // Default walkway red
  if (isConnectedToSelected) {
    lineColor = '#fbbc04'; // Glowing Gold for selected junction edges
  } else if (edge.EdgeType === 'stairs') {
    lineColor = '#9c27b0';
  } else if (edge.EdgeType === 'elevator') {
    lineColor = '#3f51b5';
  }

  return (
    <group renderOrder={998}>
      {/* 3D Bold Tube */}
      <mesh
        geometry={tubeGeo}
        renderOrder={998}
        onClick={(event) => {
          if (toolMode === 'Select') {
            event.stopPropagation();
            onDelete();
          }
        }}
      >
        <meshBasicMaterial 
          color={lineColor} 
          depthTest={false} 
          depthWrite={false} 
          transparent={true} 
          opacity={isSameFloor ? (isConnectedToSelected ? 1.0 : 0.95) : 0.35} 
        />
      </mesh>
      
      {/* Inner Crisp Center Line */}
      <line geometry={lineGeo} renderOrder={999}>
        <lineBasicMaterial 
          color="#ffffff" 
          depthTest={false} 
          depthWrite={false} 
          transparent={true} 
          opacity={isSameFloor ? 0.75 : 0.25} 
        />
      </line>
    </group>
  );
}

export default function AdminMapEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeFloor, setActiveFloor] = useState('0'); // '0' is First Floor
  const [toolMode, setToolMode] = useState('Select'); 
  const [selectedNodeA, setSelectedNodeA] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [orthogonalSnap, setOrthogonalSnap] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Drag and Drop State & Refs
  const [isDragging, setIsDragging] = useState(false);
  const draggedNodeRef = useRef(null);
  const dragStartPosRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const controlsRef = useRef(null);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchGraph = async () => {
    try {
      const [nRes, eRes] = await Promise.all([
        axios.get('/api/nodes'),
        axios.get('/api/edges')
      ]);
      setNodes(nRes.data);
      setEdges(eRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchGraph(); 
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Global window pointerup to safely commit drag drops
  useEffect(() => {
    const handleGlobalPointerUp = async () => {
      if (!draggedNodeRef.current) return;
      const node = draggedNodeRef.current;
      const didDrag = hasDraggedRef.current;
      
      draggedNodeRef.current = null;
      setIsDragging(false);
      document.body.style.cursor = 'default';

      if (didDrag) {
        hasDraggedRef.current = false;
        const latest = nodesRef.current.find(n => n.NodeID === node.NodeID);
        if (latest) {
          try {
            await axios.put(`/api/nodes/${latest._id}`, {
              NodeID: latest.NodeID,
              Name: latest.Name,
              Type: latest.Type,
              Floor: latest.Floor,
              X: latest.X,
              Y: latest.Y
            });
            showToast(`Saved new position for ${latest.Name} (${latest.X}, ${latest.Y})`);
            fetchGraph();
          } catch (err) {
            showToast("Failed to save node position.");
          }
        }
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.edge_id) await axios.delete(`/api/edges/${lastAction.edge_id}`);
      if (lastAction.node_id) await axios.delete(`/api/nodes/${lastAction.node_id}`);
      
      setUndoStack(prev => prev.slice(0, -1));
      setSelectedNodeA(lastAction.prevSelectedNode);
      showToast("Undid last action.");
      fetchGraph();
    } catch (err) {
      alert("Undo failed.");
    }
  };

  // Pointer Down on a Node Sphere (Initiates Drag & Drop)
  const handleNodePointerDown = (e, node) => {
    if (toolMode === 'DragMode' || toolMode === 'MoveMode') {
      e.stopPropagation();
      draggedNodeRef.current = node;
      dragStartPosRef.current = { x: node.X, y: node.Y };
      hasDraggedRef.current = false;
      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
    }
  };

  // Pointer Move on Floor Plane (Live Dragging & Rubberbanding)
  const handlePlanePointerMove = (e) => {
    if (!draggedNodeRef.current) return;
    e.stopPropagation();
    hasDraggedRef.current = true;

    let svgX = Math.round(e.point.x - OFFSET_X);
    let svgY = Math.round(e.point.z - OFFSET_Z);

    if (orthogonalSnap || e.nativeEvent?.shiftKey) {
      const orig = dragStartPosRef.current;
      if (orig) {
        const dx = Math.abs(svgX - orig.x);
        const dy = Math.abs(svgY - orig.y);
        if (dx > dy) {
          svgY = orig.y; // lock horizontal
        } else {
          svgX = orig.x; // lock vertical
        }
      }
    }

    // Live update local node state so connected edges stretch in real-time
    const currentDragId = draggedNodeRef.current.NodeID;
    setNodes(prev => prev.map(n => n.NodeID === currentDragId ? { ...n, X: svgX, Y: svgY } : n));
  };

  const handleMapClick = async (point, nativeEvent) => {
    if (hasDraggedRef.current) return;

    let svgX = Math.round(point.x - OFFSET_X);
    let svgY = Math.round(point.z - OFFSET_Z);

    if (toolMode === 'MoveMode' && selectedNodeA) {
      if (orthogonalSnap || nativeEvent?.shiftKey) {
        const dx = Math.abs(svgX - selectedNodeA.X);
        const dy = Math.abs(svgY - selectedNodeA.Y);
        if (dx > dy) svgY = selectedNodeA.Y;
        else svgX = selectedNodeA.X;
      }
      try {
        const payload = {
          NodeID: selectedNodeA.NodeID,
          Name: selectedNodeA.Name,
          Type: selectedNodeA.Type,
          Floor: selectedNodeA.Floor,
          X: svgX,
          Y: svgY
        };
        await axios.put(`/api/nodes/${selectedNodeA._id}`, payload);
        showToast(`Moved ${selectedNodeA.Name} to (${svgX}, ${svgY})`);
        setSelectedNodeA(null);
        fetchGraph();
      } catch (err) { alert("Failed to move node."); }
      return;
    }

    if (toolMode === 'AddJunction') {
      try {
        const newNode = {
          NodeID: 'J' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
          Name: 'Junction',
          Type: 'Junction',
          Floor: activeFloor,
          X: svgX,
          Y: svgY
        };
        const resNode = await axios.post('/api/nodes', newNode);
        showToast(`Placed new Junction (${resNode.data.NodeID}). Drag or click to link it!`);
        setSelectedNodeA(resNode.data);
        fetchGraph();
      } catch (err) {
        alert("Failed to place junction.");
      }
      return;
    }
    
    if (toolMode === 'DrawPath') {
      if (!selectedNodeA) {
        showToast("Click an existing node or junction to start drawing.");
        return;
      }

      // Orthogonal constraint (90-degree lock)
      if (orthogonalSnap || nativeEvent?.shiftKey) {
        const dx = Math.abs(svgX - selectedNodeA.X);
        const dy = Math.abs(svgY - selectedNodeA.Y);
        if (dx > dy) {
          svgY = selectedNodeA.Y; // horizontal line
        } else {
          svgX = selectedNodeA.X; // vertical line
        }
      }

      // Magnetic Snapping to Existing Junctions / Rooms within 90 units
      const SNAP_RADIUS = 90;
      const nearbyNode = nodes.find(n => 
        String(n.Floor) === String(activeFloor) &&
        n.NodeID !== selectedNodeA.NodeID &&
        Math.hypot(n.X - svgX, n.Y - svgY) <= SNAP_RADIUS
      );

      if (nearbyNode) {
        // Snap directly to nearby node instead of creating duplicate!
        const edgeAlreadyExists = edges.some(e => 
          (e.StartNodeID === selectedNodeA.NodeID && e.EndNodeID === nearbyNode.NodeID) ||
          (e.StartNodeID === nearbyNode.NodeID && e.EndNodeID === selectedNodeA.NodeID)
        );

        if (edgeAlreadyExists) {
          showToast(`Already connected: ${selectedNodeA.Name} ↔ ${nearbyNode.Name}`);
          setSelectedNodeA(nearbyNode);
          return;
        }

        try {
          const dist = Math.round(Math.hypot(selectedNodeA.X - nearbyNode.X, selectedNodeA.Y - nearbyNode.Y));
          const resEdge = await axios.post('/api/edges', {
            EdgeID: 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
            StartNodeID: selectedNodeA.NodeID,
            EndNodeID: nearbyNode.NodeID,
            Distance: dist,
            EdgeType: 'walkway'
          });

          const targetDeg = getNodeDegree(nearbyNode.NodeID, edges) + 1;
          const badge = getJunctionBadge(targetDeg);
          showToast(`Magnetic Snapped to ${nearbyNode.Name}! (Now ${badge.label})`);

          setUndoStack(prev => [...prev, {
            node_id: null,
            edge_id: resEdge.data._id,
            prevSelectedNode: selectedNodeA
          }]);
          
          setSelectedNodeA(nearbyNode);
          fetchGraph();
        } catch (err) {
          showToast("Failed to snap edge to junction.");
        }
        return;
      }

      // No nearby node: create new waypoint junction
      try {
        const newNode = {
          NodeID: 'J' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
          Name: 'Junction',
          Type: 'Junction',
          Floor: activeFloor,
          X: svgX,
          Y: svgY
        };
        const resNode = await axios.post('/api/nodes', newNode);
        
        const dist = Math.round(Math.hypot(selectedNodeA.X - svgX, selectedNodeA.Y - svgY));
        
        const resEdge = await axios.post('/api/edges', {
          EdgeID: 'E' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),
          StartNodeID: selectedNodeA.NodeID,
          EndNodeID: newNode.NodeID,
          Distance: dist,
          EdgeType: 'walkway'
        });
        
        setUndoStack(prev => [...prev, {
          node_id: resNode.data._id,
          edge_id: resEdge.data._id,
          prevSelectedNode: selectedNodeA
        }]);
        
        setSelectedNodeA(resNode.data);
        showToast("Added 2-Way corridor waypoint. Click next point or click a node to connect.");
        fetchGraph();
      } catch (err) { alert("Failed to draw path point."); }
      return;
    }

    if (toolMode === 'AddNode') {
      const name = prompt("Enter Node Name (Leave blank for invisible junction)");
      if (name === null) return;
      
      const type = name.trim() === "" ? "Junction" : "Room";
      
      const newNode = {
        NodeID: `N${Date.now().toString().slice(-6)}`,
        Name: name.trim() || `Junction-${Date.now().toString().slice(-4)}`,
        Type: type,
        Floor: activeFloor,
        X: svgX,
        Y: svgY
      };

      try {
        const resNode = await axios.post('/api/nodes', newNode);
        showToast(`Created ${newNode.Name}`);
        fetchGraph();
      } catch (err) { alert("Failed to create node."); }
    }
  };

  const handleNodeClick = async (e, clickedNode) => {
    e.stopPropagation();
    if (hasDraggedRef.current) return;

    if (toolMode === 'AddEdge' || toolMode === 'DrawPath') {
      if (!selectedNodeA) {
        setSelectedNodeA(clickedNode);
        const deg = getNodeDegree(clickedNode.NodeID, edges);
        const badge = getJunctionBadge(deg);
        showToast(`Selected ${clickedNode.Name} [${clickedNode.Type === 'Junction' ? badge.label : deg + ' edges'}]. Click target node.`);
      } else {
        if (selectedNodeA.NodeID === clickedNode.NodeID) {
          setSelectedNodeA(null);
          showToast("Deselected node.");
          return;
        }

        // Check if edge already exists
        const edgeAlreadyExists = edges.some(edge => 
          (edge.StartNodeID === selectedNodeA.NodeID && edge.EndNodeID === clickedNode.NodeID) ||
          (edge.StartNodeID === clickedNode.NodeID && edge.EndNodeID === selectedNodeA.NodeID)
        );

        if (edgeAlreadyExists) {
          showToast(`Already connected: ${selectedNodeA.Name} ↔ ${clickedNode.Name} (Prevented duplicate)`);
          if (toolMode === 'DrawPath') {
            setSelectedNodeA(clickedNode);
          } else {
            setSelectedNodeA(null);
          }
          return;
        }

        const dist = Math.round(Math.hypot(selectedNodeA.X - clickedNode.X, selectedNodeA.Y - clickedNode.Y));

        const newEdge = {
          EdgeID: `E${Date.now().toString().slice(-6)}${Math.floor(Math.random()*100)}`,
          StartNodeID: selectedNodeA.NodeID,
          EndNodeID: clickedNode.NodeID,
          Distance: dist,
          EdgeType: 'walkway'
        };

        try {
          const resEdge = await axios.post('/api/edges', newEdge);

          const targetDeg = getNodeDegree(clickedNode.NodeID, edges) + 1;
          const badge = getJunctionBadge(targetDeg);
          const targetInfo = clickedNode.Type === 'Junction' ? badge.label : clickedNode.Name;
          showToast(`Connected! ${clickedNode.Name} is now ${targetInfo} (${targetDeg} ways)`);

          if (toolMode === 'DrawPath') {
            setUndoStack(prev => [...prev, {
              node_id: null,
              edge_id: resEdge.data._id,
              prevSelectedNode: selectedNodeA
            }]);
            setSelectedNodeA(clickedNode);
          } else {
            setSelectedNodeA(null);
          }
          fetchGraph();
        } catch (err) { alert("Failed to create edge."); setSelectedNodeA(null); }
      }
    } else if (toolMode === 'MoveMode') {
      if (!selectedNodeA) {
        setSelectedNodeA(clickedNode);
        showToast(`Selected ${clickedNode.Name} to move. Drag it or click new location.`);
      }
    } else if (toolMode === 'DragMode') {
      showToast(`Click and drag ${clickedNode.Name} directly to move it.`);
    } else if (toolMode === 'Select') {
      if (window.confirm(`Delete Node: ${clickedNode.Name}?`)) {
        try {
          await axios.delete(`/api/nodes/${clickedNode._id}`);
          showToast(`Deleted ${clickedNode.Name}`);
          fetchGraph();
        } catch (err) { console.error(err); }
      }
    }
  };

  // Junction Statistics for Active Floor
  const currentFloorNodes = useMemo(() => {
    return nodes.filter(n => String(n.Floor) === String(activeFloor));
  }, [nodes, activeFloor]);

  const junctionStats = useMemo(() => {
    const junctions = currentFloorNodes.filter(n => n.Type === 'Junction');
    let fourWay = 0, threeWay = 0, twoWay = 0, stubs = 0, unlinked = 0;
    
    junctions.forEach(j => {
      const deg = getNodeDegree(j.NodeID, edges);
      if (deg >= 4) fourWay++;
      else if (deg === 3) threeWay++;
      else if (deg === 2) twoWay++;
      else if (deg === 1) stubs++;
      else unlinked++;
    });

    const unlinkedRooms = currentFloorNodes.filter(n => n.Type !== 'Junction' && getNodeDegree(n.NodeID, edges) === 0).length;

    return { fourWay, threeWay, twoWay, stubs, unlinked, unlinkedRooms };
  }, [currentFloorNodes, edges]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px', background: 'white', borderBottom: '1px solid #dadce0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#202124', fontSize: '22px', fontWeight: 700 }}>Visual Map Editor</h2>
            <p style={{ margin: '4px 0 0 0', color: '#5f6368', fontSize: '13px' }}>
              Multi-way Junction & Drag-and-Drop System: Drag nodes directly to edit paths, connect crossroads, and extend corridors.
            </p>
          </div>

          {/* Real-time Junction Topology Health Badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5f6368' }}>Floor Junctions:</span>
            <span style={{ background: '#e6f4ea', color: '#137333', border: '1px solid #34a853', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
              ✛ 4-Way: {junctionStats.fourWay}
            </span>
            <span style={{ background: '#e8f0fe', color: '#1a73e8', border: '1px solid #4285f4', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
              ┳ 3-Way: {junctionStats.threeWay}
            </span>
            <span style={{ background: '#f1f3f4', color: '#3c4043', border: '1px solid #9aa0a6', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
              ━ 2-Way: {junctionStats.twoWay}
            </span>
            {junctionStats.stubs > 0 && (
              <span style={{ background: '#fef7e0', color: '#b06000', border: '1px solid #fbbc04', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                • 1-Way Stubs: {junctionStats.stubs}
              </span>
            )}
            {junctionStats.unlinked > 0 && (
              <span style={{ background: '#fce8e6', color: '#c5221f', border: '1px solid #ea4335', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                ⚠ Unlinked: {junctionStats.unlinked}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <strong>Floor: </strong>
            <select value={activeFloor} onChange={e => {setActiveFloor(e.target.value); setSelectedNodeA(null);}} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #dadce0', fontWeight: 600, outline: 'none' }}>
              <option value="-1">Ground Floor (G)</option>
              <option value="0">First Floor (F1)</option>
              <option value="1">Second Floor (F2)</option>
            </select>
          </div>

          <div style={{ borderLeft: '1px solid #dadce0', paddingLeft: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {setToolMode('Select'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'Select' ? '#e8f0fe' : 'white', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'Select' ? 'bold' : '500' }}
            >
              🗑️ Delete Mode
            </button>
            <button 
              onClick={() => {setToolMode('DragMode'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'DragMode' ? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#b06000', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'DragMode' ? 'bold' : '500' }}
              title="Click and drag any junction or room node across the floor"
            >
              🖐️ Drag & Drop
            </button>
            <button 
              onClick={() => {setToolMode('AddJunction'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'AddJunction' ? '#e6f4ea' : 'white', border: '1px solid #137333', color: '#137333', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'AddJunction' ? 'bold' : '500' }}
            >
              ➕ Add Junction
            </button>
            <button 
              onClick={() => {setToolMode('AddNode'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'AddNode' ? '#f1f3f4' : 'white', border: '1px solid #5f6368', color: '#3c4043', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'AddNode' ? 'bold' : '500' }}
            >
              🚪 Add Room
            </button>
            <button 
              onClick={() => {setToolMode('AddEdge'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'AddEdge' ? '#fce8e6' : 'white', border: '1px solid #d93025', color: '#d93025', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'AddEdge' ? 'bold' : '500' }}
            >
              🔗 Link Nodes (Manual)
            </button>
            <button 
              onClick={() => {setToolMode('DrawPath'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'DrawPath' ? '#f3e8fd' : 'white', border: '1px solid #9334e6', color: '#9334e6', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'DrawPath' ? 'bold' : '500' }}
            >
              ✏️ Draw Path (Snap & Extend)
            </button>
            <button 
              onClick={() => {setToolMode('MoveMode'); setSelectedNodeA(null); setUndoStack([]);}} 
              style={{ padding: '8px 14px', background: toolMode === 'MoveMode' ? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#b06000', borderRadius: '6px', cursor: 'pointer', fontWeight: toolMode === 'MoveMode' ? 'bold' : '500' }}
            >
              ✥ Move Node
            </button>
          </div>

          {/* Orthogonal Snap Toggle */}
          <div style={{ borderLeft: '1px solid #dadce0', paddingLeft: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setOrthogonalSnap(prev => !prev)}
              style={{
                padding: '7px 12px',
                background: orthogonalSnap ? '#e6f4ea' : '#f1f3f4',
                border: `1px solid ${orthogonalSnap ? '#34a853' : '#dadce0'}`,
                color: orthogonalSnap ? '#137333' : '#5f6368',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Aligns path segments to straight horizontal or vertical corridors (Hold Shift to toggle while clicking or dragging)"
            >
              <span>📐 90° Orthogonal:</span>
              <strong style={{ textTransform: 'uppercase' }}>{orthogonalSnap ? 'ON' : 'OFF'}</strong>
            </button>
          </div>
        </div>

        {/* Dynamic Instructional Banner */}
        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#f8f9fa', border: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {toolMode === 'Select' && <span style={{ color: '#1a73e8', fontSize: '13px' }}><strong>Delete Mode:</strong> Click any Node or Path edge to delete it.</span>}
            {toolMode === 'DragMode' && (
              <span style={{ color: '#b06000', fontSize: '13px' }}>
                <strong>🖐️ Drag & Drop Mode:</strong> Click and drag any Junction or Room directly across the 3D floor. All connected paths stretch in real time. Release to drop and save!
              </span>
            )}
            {toolMode === 'AddJunction' && <span style={{ color: '#137333', fontSize: '13px' }}><strong>Add Junction:</strong> Click anywhere on the corridor floor to drop a Junction node, then link or drag it.</span>}
            {toolMode === 'AddNode' && <span style={{ color: '#3c4043', fontSize: '13px' }}><strong>Add Room:</strong> Click anywhere to place a Room or named POI node.</span>}
            {toolMode === 'AddEdge' && (
              <span style={{ color: '#d93025', fontSize: '13px' }}>
                <strong>Link Nodes:</strong> {selectedNodeA ? `Selected [${selectedNodeA.Name}] (${getNodeDegree(selectedNodeA.NodeID, edges)} ways). Click target node to establish multi-way junction.` : 'Click a starting node or junction to begin linking.'}
              </span>
            )}
            {toolMode === 'MoveMode' && (
              <span style={{ color: '#b06000', fontSize: '13px' }}>
                <strong>Move Mode:</strong> Click or drag a node to reposition it. Release or click new position to save.
              </span>
            )}
            {toolMode === 'DrawPath' && (
              <span style={{ color: '#9334e6', fontSize: '13px' }}>
                <strong>Draw Path:</strong> {selectedNodeA 
                  ? `Extending from [${selectedNodeA.Name}]. Click floor to drop waypoints (snaps to 90°). Click near existing junctions (≤90 units) to magnetic-snap into 3-Way or 4-Way crossroads.` 
                  : 'Click any starting node or junction to begin drawing a corridor path.'}
              </span>
            )}
          </div>

          {undoStack.length > 0 && (
            <button onClick={handleUndo} style={{ padding: '5px 14px', background: '#fce8e6', border: '1px solid #d93025', color: '#d93025', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
              ↩ Undo Last Point
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div style={{ height: 'calc(100vh - 150px)', minHeight: '620px', position: 'relative', background: '#E8EAED', overflow: 'hidden' }}>
        
        {/* Toast Notification Pill */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(32, 33, 36, 0.92)',
            color: '#ffffff',
            padding: '8px 22px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)'
          }}>
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Junction Legend Card in 3D View */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(6px)',
          border: '1px solid #dadce0',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          zIndex: 900,
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <strong style={{ color: '#202124', marginBottom: '2px' }}>Junction Degrees:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0f9d58' }}></span>
            <span><strong>✛ 4-Way Crossroad</strong> (4 paths meet)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1a73e8' }}></span>
            <span><strong>┳ 3-Way T-Junction</strong> (Corridor branch / room)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#5f6368' }}></span>
            <span><strong>━ 2-Way Turn</strong> (Corridor bend)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbc04' }}></span>
            <span><strong>Selected Active Node / Dragging</strong></span>
          </div>
        </div>

        <Canvas raycaster={{ params: { Points: { threshold: 100 }, Line: { threshold: 100 }, Mesh: { threshold: 100 } } }} camera={{ position: [0, 8000, 2000], fov: 45, near: 10, far: 50000 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[1000, 3000, 1000]} intensity={1.5} color="#fffcf5" />
          
          <OrbitControls 
            ref={controlsRef}
            enabled={!isDragging}
            target={[0, Y_OFFSETS[activeFloor] || 0, 0]}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={100}
            maxDistance={30000}
            makeDefault
          />

          <Suspense fallback={null}>
            <RealBuildingModel activeBuilding="ramanujan" activeFloor={activeFloor} />
            
            {/* Click & Drag Catcher Plane */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, (Y_OFFSETS[activeFloor] || 0) + 40, 0]} 
              onClick={(e) => {
                if (!hasDraggedRef.current) {
                  e.stopPropagation();
                  handleMapClick(e.point, e.nativeEvent);
                }
              }}
              onPointerMove={handlePlanePointerMove}
            >
              <planeGeometry args={[100000, 100000]} />
              <meshBasicMaterial opacity={0} transparent={true} />
            </mesh>

            {/* Render Nodes */}
            {currentFloorNodes.map((n) => {
              const isSelected = selectedNodeA?.NodeID === n.NodeID || (isDragging && draggedNodeRef.current?.NodeID === n.NodeID);
              const isJunction = n.Type === 'Junction';
              const deg = getNodeDegree(n.NodeID, edges);
              const badge = getJunctionBadge(deg);
              
              const sphereRadius = isJunction ? badge.radius : 95;
              const nodeColor = isSelected ? '#fbbc04' : (isJunction ? badge.sphereColor : (deg > 0 ? '#1a73e8' : '#d93025'));

              return (
                <group key={n.NodeID} position={[n.X + OFFSET_X, (Y_OFFSETS[activeFloor] || 0) + 120, n.Y + OFFSET_Z]}>
                  {/* Selected / Dragging Glowing Halo */}
                  {isSelected && (
                    <mesh>
                      <sphereGeometry args={[sphereRadius + 30, 16, 16]} />
                      <meshBasicMaterial color="#fbbc04" transparent opacity={0.35} />
                    </mesh>
                  )}

                  {/* Main Node Sphere with Drag & Click Handlers */}
                  <mesh 
                    onPointerDown={(e) => handleNodePointerDown(e, n)}
                    onClick={(e) => handleNodeClick(e, n)}
                    onPointerOver={() => {
                      if (toolMode === 'DragMode' || toolMode === 'MoveMode') {
                        document.body.style.cursor = 'grab';
                      }
                    }}
                    onPointerOut={() => {
                      if (!isDragging) {
                        document.body.style.cursor = 'default';
                      }
                    }}
                  >
                    <sphereGeometry args={[sphereRadius, 16, 16]} />
                    <meshBasicMaterial color={nodeColor} />
                  </mesh>

                  {/* Node Badge / Label */}
                  {isJunction ? (
                    <Html wrapperClass="no-pointer-events" position={[0, 140, 0]} center style={{ pointerEvents: 'none' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1.5px solid ${badge.border}`,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        userSelect: 'none'
                      }}>
                        <span>{badge.label}</span>
                        <span style={{ opacity: 0.7, fontSize: '10px' }}>
                          ({n.NodeID.replace('J-F1-', '').replace('J-G-', '').replace('J-F2-', '').replace('J', '')})
                        </span>
                      </div>
                    </Html>
                  ) : (
                    <Html wrapperClass="no-pointer-events" position={[0, 160, 0]} center style={{ pointerEvents: 'none' }}>
                      <div style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        border: `1.5px solid ${deg === 0 ? '#ea4335' : '#1a73e8'}`,
                        fontWeight: 'bold',
                        color: '#202124',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        userSelect: 'none'
                      }}>
                        {n.Name} {deg === 0 && <span style={{ color: '#d93025' }}>(Unlinked)</span>}
                      </div>
                    </Html>
                  )}
                </group>
              );
            })}

            {/* Render Edges as bold 3D Tubes (Never occluded by floor geometry) */}
            {edges.map((e) => {
              const start = nodes.find(n => n.NodeID === e.StartNodeID);
              const end = nodes.find(n => n.NodeID === e.EndNodeID);
              if (!start || !end) return null;
              if (String(start.Floor) !== String(activeFloor) && String(end.Floor) !== String(activeFloor)) return null; 
              
              const isConnectedToSelected = selectedNodeA && (e.StartNodeID === selectedNodeA.NodeID || e.EndNodeID === selectedNodeA.NodeID);

              return (
                <EditorEdge
                  key={e.EdgeID}
                  edge={e}
                  start={start}
                  end={end}
                  activeFloor={activeFloor}
                  toolMode={toolMode}
                  isConnectedToSelected={isConnectedToSelected}
                  onDelete={async () => {
                    if (window.confirm('Delete this path?')) {
                      try {
                        await axios.delete(`/api/edges/${e._id}`);
                        showToast("Deleted path edge.");
                        fetchGraph();
                      } catch (err) { console.error(err); }
                    }
                  }}
                />
              );
            })}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
