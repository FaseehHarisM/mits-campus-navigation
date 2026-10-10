import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { RealBuildingModel } from '../components/RealBuildingModel';

const OFFSET_X = -1920 / 2;
const OFFSET_Z = -1080 / 2;
const Y_OFFSETS = { '-1': -600, '0': 0, '1': 600 };

export default function AdminMapEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeFloor, setActiveFloor] = useState('0'); // '0' is First Floor
  const [toolMode, setToolMode] = useState('Select'); 
  const [selectedNodeA, setSelectedNodeA] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

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

  useEffect(() => { fetchGraph(); }, []);

  
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    try {
      if (lastAction.edge_id) await axios.delete(`/api/edges/${lastAction.edge_id}`);
      if (lastAction.node_id) await axios.delete(`/api/nodes/${lastAction.node_id}`);
      
      setUndoStack(prev => prev.slice(0, -1));
      setSelectedNodeA(lastAction.prevSelectedNode);
      fetchGraph();
    } catch (err) {
      alert("Undo failed.");
    }
  };

  const handleMapClick = async (point) => {
    if (toolMode === 'MoveMode' && selectedNodeA) {
      const svgX = Math.round(point.x - OFFSET_X);
      const svgY = Math.round(point.z - OFFSET_Z);
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

        setSelectedNodeA(null);
        fetchGraph();
      } catch (err) { alert("Failed to move node."); }
      return;
    }
    
      if (toolMode === 'DrawPath') {
        if (!selectedNodeA) {
          alert("Please click an existing node first to start drawing a path from it.");
          return;
        }
        const svgX = Math.round(point.x - OFFSET_X);
        const svgY = Math.round(point.z - OFFSET_Z);
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
          
          const dx = selectedNodeA.X - svgX;
          const dy = selectedNodeA.Y - svgY;
          const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
          
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
          fetchGraph();
        } catch (err) { alert("Failed to draw path point."); }
        return;
      }

      if (toolMode === 'AddNode') {
      const name = prompt("Enter Node Name (Leave blank for invisible junction)");
      if (name === null) return;
      
      const type = name.trim() === "" ? "Junction" : "Room";
      const svgX = Math.round(point.x - OFFSET_X);
      const svgY = Math.round(point.z - OFFSET_Z);
      
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
        fetchGraph();
      } catch (err) { alert("Failed to create node."); }
    }
  };

  const handleNodeClick = async (e, clickedNode) => {
    e.stopPropagation();
    if (toolMode === 'AddEdge' || toolMode === 'DrawPath') {
      if (!selectedNodeA) {
        setSelectedNodeA(clickedNode);
      } else {
        if (selectedNodeA.NodeID === clickedNode.NodeID) {
          setSelectedNodeA(null);
          return;
        }
        const dx = selectedNodeA.X - clickedNode.X;
        const dy = selectedNodeA.Y - clickedNode.Y;
        const dist = Math.round(Math.sqrt(dx*dx + dy*dy));
        
        const newEdge = {
          EdgeID: `E${Date.now().toString().slice(-6)}${Math.floor(Math.random()*100)}`,
          StartNodeID: selectedNodeA.NodeID,
          EndNodeID: clickedNode.NodeID,
          Distance: dist,
          EdgeType: 'walkway'
        };

        try {
          const resEdge = await axios.post('/api/edges', newEdge);
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
      }
    } else if (toolMode === 'Select') {
        if (window.confirm(`Delete Node: ${clickedNode.Name}?`)) {
            try {
                await axios.delete(`/api/nodes/${clickedNode._id}`);
                fetchGraph();
            } catch (err) { console.error(err); }
        }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', background: 'white', borderBottom: '1px solid #dadce0' }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#3c4043' }}>Visual Map Editor</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <strong>Floor: </strong>
            <select value={activeFloor} onChange={e => {setActiveFloor(e.target.value); setSelectedNodeA(null);}} style={{ padding: '8px', borderRadius: '4px' }}>
              <option value="-1">Ground Floor (G)</option>
              <option value="0">First Floor (F1)</option>
              <option value="1">Second Floor (F2)</option>
            </select>
          </div>
          <div style={{ borderLeft: '1px solid #dadce0', paddingLeft: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={() => {setToolMode('Select'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'Select' ? '#e8f0fe' : 'white', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'Select' ? 'bold' : 'normal' }}>Delete Mode</button>
            <button onClick={() => {setToolMode('AddNode'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'AddNode' ? '#e6f4ea' : 'white', border: '1px solid #1e8e3e', color: '#1e8e3e', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddNode' ? 'bold' : 'normal' }}>Add Node</button>
            <button onClick={() => {setToolMode('AddEdge'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'AddEdge' ? '#fce8e6' : 'white', border: '1px solid #d93025', color: '#d93025', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddEdge' ? 'bold' : 'normal' }}>Link Nodes</button>
            <button onClick={() => {setToolMode('MoveMode'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'MoveMode' ? '#fef7e0' : 'white', border: '1px solid #fbbc04', color: '#fbbc04', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'MoveMode' ? 'bold' : 'normal' }}>Move Node</button>
            <button onClick={() => {setToolMode('DrawPath'); setSelectedNodeA(null); setUndoStack([]);}} style={{ padding: '8px 16px', background: toolMode === 'DrawPath' ? '#f3e8fd' : 'white', border: '1px solid #9334e6', color: '#9334e6', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'DrawPath' ? 'bold' : 'normal' }}>✏️ Draw Path</button>
          </div>
        </div>
        {toolMode === 'Select' && <p style={{ margin: '8px 0 0 0', color: '#1a73e8', fontSize: '14px' }}><strong>Instructions:</strong> Click any Node or Path (Red Line) to delete it.</p>}
          {toolMode === 'AddNode' && <p style={{ margin: '8px 0 0 0', color: '#1e8e3e', fontSize: '14px' }}><strong>Instructions:</strong> Click anywhere on the floor to place a node.</p>}
        {toolMode === 'AddEdge' && <p style={{ margin: '8px 0 0 0', color: '#d93025', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click a second node to link to ${selectedNodeA.Name}` : 'Click the first node to start linking'}</p>}
        {toolMode === 'MoveMode' && <p style={{ margin: '8px 0 0 0', color: '#fbbc04', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click anywhere on the floor to drop ${selectedNodeA.Name} at the new location.` : 'Click a node you want to move.'}</p>}
          {toolMode === 'DrawPath' && <p style={{ margin: '8px 0 0 0', color: '#9334e6', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click the floor to drop waypoints around corners. Click a Room to link it. Click ${selectedNodeA.Name} again to stop drawing.` : 'Click any starting Room to begin drawing a path.'}
            {undoStack.length > 0 && (
              <button onClick={handleUndo} style={{ marginLeft: '16px', padding: '4px 12px', background: '#fce8e6', border: '1px solid #d93025', color: '#d93025', borderRadius: '16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                ↩ Undo Last Point
              </button>
            )}
          </p>}
      </div>

      <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px', position: 'relative', background: '#E8EAED', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
        <Canvas raycaster={{ params: { Points: { threshold: 100 }, Line: { threshold: 100 }, Mesh: { threshold: 100 } } }} camera={{ position: [0, 8000, 2000], fov: 45, near: 10, far: 50000 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[1000, 3000, 1000]} intensity={1.5} color="#fffcf5" />
          
          <OrbitControls 
            target={[0, Y_OFFSETS[activeFloor] || 0, 0]}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={100}
            maxDistance={30000}
            makeDefault
          />

          <Suspense fallback={null}>
            <RealBuildingModel activeBuilding="ramanujan" activeFloor={activeFloor} />
            
            {/* Click Catcher Plane */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, (Y_OFFSETS[activeFloor] || 0) + 5, 0]} 
              onClick={(e) => {
                e.stopPropagation();
                handleMapClick(e.point);
              }}
            >
              <planeGeometry args={[100000, 100000]} />
              <meshBasicMaterial opacity={0} transparent={true} />
            </mesh>

            {/* Render Nodes */}
            {nodes.filter(n => String(n.Floor) === String(activeFloor)).map((n) => (
              <mesh 
                key={n.NodeID} 
                position={[n.X + OFFSET_X, (Y_OFFSETS[activeFloor] || 0) + 120, n.Y + OFFSET_Z]}
                onClick={(e) => handleNodeClick(e, n)}
              >
                <sphereGeometry args={[100, 16, 16]} />
                <meshBasicMaterial color={selectedNodeA?.NodeID === n.NodeID ? '#fbbc04' : (n.Type === 'Junction' ? '#80868b' : '#1a73e8')} />
                
                <Html wrapperClass="no-pointer-events" position={[0, 150, 0]} center style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', border: '1px solid #dadce0', fontWeight: 'bold' }}>
                  {n.Name}
                </Html>
              </mesh>
            ))}

            {/* Render Edges */}
            {edges.map((e) => {
              const start = nodes.find(n => n.NodeID === e.StartNodeID);
              const end = nodes.find(n => n.NodeID === e.EndNodeID);
              if (!start || !end) return null;
              if (String(start.Floor) !== String(activeFloor) && String(end.Floor) !== String(activeFloor)) return null; 
              
              const startY = (Y_OFFSETS[start.Floor] || 0) + 50;
              const endY = (Y_OFFSETS[end.Floor] || 0) + 50;
              
              const points = [
                new THREE.Vector3(start.X + OFFSET_X, startY, start.Y + OFFSET_Z),
                new THREE.Vector3(end.X + OFFSET_X, endY, end.Y + OFFSET_Z)
              ];
              const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
              return (
                <line 
                    key={e.EdgeID} 
                    geometry={lineGeo}
                    onClick={async (event) => {
                      event.stopPropagation();
                      if (toolMode === 'Select') {
                        if (window.confirm('Delete this path?')) {
                          try {
                            await axios.delete(`/api/edges/${e._id}`);
                            fetchGraph();
                          } catch (err) { console.error(err); }
                        }
                      }
                    }}
                  >
                    <lineBasicMaterial color="#d93025" linewidth={5} />
                  </line>
              );
            })}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
