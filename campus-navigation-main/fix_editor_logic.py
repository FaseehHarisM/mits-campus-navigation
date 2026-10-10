import os

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
content = """import React, { useState, useEffect, Suspense } from 'react';
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

  const handleMapClick = async (point) => {
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
        await axios.post('/api/nodes', newNode);
        fetchGraph();
      } catch (err) { alert("Failed to create node."); }
    }
  };

  const handleNodeClick = async (e, clickedNode) => {
    e.stopPropagation();
    if (toolMode === 'AddEdge') {
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
          EdgeID: `E${Date.now().toString().slice(-6)}`,
          StartNodeID: selectedNodeA.NodeID,
          EndNodeID: clickedNode.NodeID,
          Distance: dist,
          EdgeType: 'walkway'
        };

        try {
          await axios.post('/api/edges', newEdge);
          setSelectedNodeA(null);
          fetchGraph();
        } catch (err) { alert("Failed to create edge."); setSelectedNodeA(null); }
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
            <button onClick={() => {setToolMode('Select'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'Select' ? '#e8f0fe' : 'white', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'Select' ? 'bold' : 'normal' }}>Delete Mode</button>
            <button onClick={() => {setToolMode('AddNode'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'AddNode' ? '#e6f4ea' : 'white', border: '1px solid #1e8e3e', color: '#1e8e3e', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddNode' ? 'bold' : 'normal' }}>Add Node</button>
            <button onClick={() => {setToolMode('AddEdge'); setSelectedNodeA(null);}} style={{ padding: '8px 16px', background: toolMode === 'AddEdge' ? '#fce8e6' : 'white', border: '1px solid #d93025', color: '#d93025', borderRadius: '4px', cursor: 'pointer', fontWeight: toolMode === 'AddEdge' ? 'bold' : 'normal' }}>Link Nodes</button>
          </div>
        </div>
        {toolMode === 'AddNode' && <p style={{ margin: '8px 0 0 0', color: '#1e8e3e', fontSize: '14px' }}><strong>Instructions:</strong> Click anywhere on the floor to place a node.</p>}
        {toolMode === 'AddEdge' && <p style={{ margin: '8px 0 0 0', color: '#d93025', fontSize: '14px' }}><strong>Instructions:</strong> {selectedNodeA ? `Click a second node to link to ${selectedNodeA.Name}` : 'Click the first node to start linking'}</p>}
      </div>

      <div style={{ height: 'calc(100vh - 120px)', minHeight: '600px', position: 'relative', background: '#E8EAED', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 8000, 2000], fov: 45, near: 10, far: 50000 }}>
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
              onPointerDown={(e) => {
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
                position={[n.X + OFFSET_X, (Y_OFFSETS[activeFloor] || 0) + 50, n.Y + OFFSET_Z]}
                onPointerDown={(e) => handleNodeClick(e, n)}
              >
                <sphereGeometry args={[40, 16, 16]} />
                <meshBasicMaterial color={selectedNodeA?.NodeID === n.NodeID ? '#fbbc04' : (n.Type === 'Junction' ? '#80868b' : '#1a73e8')} />
                
                <Html position={[0, 80, 0]} center style={{ pointerEvents: 'none', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap', border: '1px solid #dadce0', fontWeight: 'bold' }}>
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
                <line key={e.EdgeID} geometry={lineGeo}>
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
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminMapEditor fully corrected.")
