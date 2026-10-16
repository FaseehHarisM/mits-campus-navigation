import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DeleteModal from '../components/DeleteModal';

// Standard floor ordering helper
const FLOOR_ORDER = {
  '-1': 0, // Ground
  '0': 1,  // 1st Floor
  '1': 2,  // 2nd Floor
  '2': 3   // 3rd Floor (if any)
};

const getFloorName = (floorVal) => {
  const str = String(floorVal);
  if (str === '-1') return 'Ground Floor';
  if (str === '0') return '1st Floor';
  if (str === '1') return '2nd Floor';
  return `Floor ${str}`;
};

const getFloorBadgeColor = (floorVal) => {
  const str = String(floorVal);
  if (str === '-1') return { bg: '#e8f0fe', text: '#1967d2' };
  if (str === '0') return { bg: '#e6f4ea', text: '#137333' };
  if (str === '1') return { bg: '#fef7e0', text: '#b06000' };
  return { bg: '#f1f3f4', text: '#3c4043' };
};

export default function AdminStairsLifts() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shafts'); // 'shafts' | 'manual' | 'table' | 'test'
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Deletion Modal State
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleteModalName, setDeleteModalName] = useState('');

  // Edge Edit Modal State
  const [editingEdge, setEditingEdge] = useState(null);
  const [edgeEditFormData, setEdgeEditFormData] = useState({
    EdgeID: '',
    StartNodeID: '',
    EndNodeID: '',
    Distance: 10,
    EdgeType: 'elevator'
  });
  const [isSavingEdge, setIsSavingEdge] = useState(false);

  // Node Edit Modal State
  const [editingNode, setEditingNode] = useState(null);
  const [nodeEditFormData, setNodeEditFormData] = useState({
    Name: '',
    Type: 'Elevator',
    Floor: '0'
  });
  const [isSavingNode, setIsSavingNode] = useState(false);

  // Manual Linker Form State
  const [manualFloorA, setManualFloorA] = useState('-1');
  const [manualNodeA, setManualNodeA] = useState('');
  const [manualFloorB, setManualFloorB] = useState('0');
  const [manualNodeB, setManualNodeB] = useState('');
  const [manualType, setManualType] = useState('elevator');
  const [manualDistance, setManualDistance] = useState(10);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Route Test Simulator State
  const [testStartNode, setTestStartNode] = useState('');
  const [testEndNode, setTestEndNode] = useState('');
  const [testAccessible, setTestAccessible] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nodesRes, edgesRes] = await Promise.all([
        axios.get('/api/nodes'),
        axios.get('/api/edges')
      ]);
      setNodes(nodesRes.data || []);
      setEdges(edgesRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching nodes/edges:', err);
      showToast('Failed to load map data: ' + (err.message || String(err)), 'error');
      setLoading(false);
    }
  };

  // Node Map for fast ID lookup
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach(n => map.set(n.NodeID, n));
    return map;
  }, [nodes]);

  // Extract all vertical nodes (Stairs, Elevator, or with matching names)
  const verticalNodes = useMemo(() => {
    return nodes.filter(n => {
      const type = (n.Type || '').toLowerCase();
      const name = (n.Name || '').toLowerCase();
      return type === 'stairs' || type === 'elevator' ||
             name.includes('lift') || name.includes('elevator') ||
             name.includes('stair') || name.includes('fire exit');
    });
  }, [nodes]);

  // Normalized shaft grouping
  // LIFT 1, LIFT 2, STAIRCASE 1, STAIRCASE 2, FIRE EXIT, etc.
  const shafts = useMemo(() => {
    const groups = {};

    verticalNodes.forEach(node => {
      let rawName = (node.Name || '').trim();
      let key = rawName.toUpperCase();
      let shaftType = (node.Type || '').toLowerCase() === 'elevator' || /lift|elevator/i.test(rawName)
        ? 'elevator'
        : 'stairs';

      // Standardize key names
      if (/lift\s*1/i.test(key) || /elevator\s*1/i.test(key)) key = 'LIFT 1';
      else if (/lift\s*2/i.test(key) || /elevator\s*2/i.test(key)) key = 'LIFT 2';
      else if (/stair(?:case)?\s*1/i.test(key)) key = 'STAIRCASE 1';
      else if (/stair(?:case)?\s*2/i.test(key)) key = 'STAIRCASE 2';
      else if (/fire\s*exit/i.test(key)) key = 'FIRE EXIT';

      if (!groups[key]) {
        groups[key] = {
          name: key,
          type: shaftType,
          nodes: []
        };
      }
      groups[key].nodes.push(node);
    });

    // Sort nodes within each shaft by floor level (-1 -> 0 -> 1 -> ...)
    const result = Object.values(groups).map(shaft => {
      shaft.nodes.sort((a, b) => {
        const orderA = FLOOR_ORDER[String(a.Floor)] ?? parseInt(a.Floor, 10);
        const orderB = FLOOR_ORDER[String(b.Floor)] ?? parseInt(b.Floor, 10);
        return orderA - orderB;
      });
      return shaft;
    });

    // Sort shafts: Lifts first, then Staircases, then others
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'elevator' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [verticalNodes]);

  // Helper to find edge connecting two specific nodes
  const findEdgeBetween = (nodeAId, nodeBId) => {
    return edges.find(e =>
      (e.StartNodeID === nodeAId && e.EndNodeID === nodeBId) ||
      (e.StartNodeID === nodeBId && e.EndNodeID === nodeAId)
    );
  };

  // Find all active vertical edges (edges where StartNode and EndNode are on different floors)
  const verticalEdges = useMemo(() => {
    return edges.filter(e => {
      const nodeA = nodeMap.get(e.StartNodeID);
      const nodeB = nodeMap.get(e.EndNodeID);
      if (!nodeA || !nodeB) return false;
      return String(nodeA.Floor) !== String(nodeB.Floor);
    });
  }, [edges, nodeMap]);

  // Statistics
  const stats = useMemo(() => {
    let totalPossiblePairs = 0;
    let connectedPairs = 0;

    shafts.forEach(shaft => {
      for (let i = 0; i < shaft.nodes.length - 1; i++) {
        totalPossiblePairs++;
        if (findEdgeBetween(shaft.nodes[i].NodeID, shaft.nodes[i + 1].NodeID)) {
          connectedPairs++;
        }
      }
    });

    return {
      totalShafts: shafts.length,
      verticalEdgesCount: verticalEdges.length,
      totalPossiblePairs,
      connectedPairs,
      percentConnected: totalPossiblePairs > 0 ? Math.round((connectedPairs / totalPossiblePairs) * 100) : 0
    };
  }, [shafts, verticalEdges, edges]);

  // Open Edit Modal for an Edge
  const handleOpenEditEdge = (edge) => {
    setEditingEdge(edge);
    setEdgeEditFormData({
      EdgeID: edge.EdgeID || '',
      StartNodeID: edge.StartNodeID || '',
      EndNodeID: edge.EndNodeID || '',
      Distance: edge.Distance ?? 10,
      EdgeType: edge.EdgeType || 'elevator'
    });
  };

  // Save Edited Edge
  const handleSaveEdgeEdit = async (e) => {
    e.preventDefault();
    if (!editingEdge) return;
    try {
      setIsSavingEdge(true);
      await axios.put(`/api/edges/${editingEdge._id}`, edgeEditFormData);
      showToast(`Edge ${edgeEditFormData.EdgeID || editingEdge.EdgeID} updated successfully!`, 'success');
      setEditingEdge(null);
      setIsSavingEdge(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update edge: ' + (err.response?.data?.message || err.message), 'error');
      setIsSavingEdge(false);
    }
  };

  // Open Edit Modal for a Node
  const handleOpenEditNode = (node) => {
    setEditingNode(node);
    setNodeEditFormData({
      Name: node.Name || '',
      Type: node.Type || 'Elevator',
      Floor: String(node.Floor ?? '0')
    });
  };

  // Save Edited Node
  const handleSaveNodeEdit = async (e) => {
    e.preventDefault();
    if (!editingNode) return;
    try {
      setIsSavingNode(true);
      await axios.put(`/api/nodes/${editingNode._id}`, nodeEditFormData);
      showToast(`Node ${editingNode.NodeID} updated successfully!`, 'success');
      setEditingNode(null);
      setIsSavingNode(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update node: ' + (err.response?.data?.message || err.message), 'error');
      setIsSavingNode(false);
    }
  };

  // Connect single pair of adjacent nodes in a shaft
  const handleConnectPair = async (nodeA, nodeB, type, customDist) => {
    try {
      const dist = customDist || (type === 'elevator' ? 10 : 80);
      const cleanName = (nodeA.Name || 'SHAFT').replace(/[^a-zA-Z0-9]/g, '');
      const edgeID = `VERT_${cleanName}_${nodeA.NodeID}_${nodeB.NodeID}`;

      // Check if already exists
      const existing = findEdgeBetween(nodeA.NodeID, nodeB.NodeID);
      if (existing) {
        showToast('Link already exists between these nodes!', 'info');
        return;
      }

      await axios.post('/api/edges', {
        EdgeID: edgeID,
        StartNodeID: nodeA.NodeID,
        EndNodeID: nodeB.NodeID,
        Distance: dist,
        EdgeType: type
      });

      showToast(`Connected ${nodeA.Name} (${getFloorName(nodeA.Floor)} ↔ ${getFloorName(nodeB.Floor)})`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to create edge: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Disconnect pair
  const handleDisconnectPair = async (nodeA, nodeB) => {
    try {
      const existing = findEdgeBetween(nodeA.NodeID, nodeB.NodeID);
      if (!existing) return;

      await axios.delete(`/api/edges/${existing._id}`);
      showToast(`Disconnected link between ${nodeA.NodeID} and ${nodeB.NodeID}`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete edge: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Connect all adjacent floor levels in a shaft
  const handleConnectEntireShaft = async (shaft) => {
    try {
      let createdCount = 0;
      for (let i = 0; i < shaft.nodes.length - 1; i++) {
        const nodeA = shaft.nodes[i];
        const nodeB = shaft.nodes[i + 1];
        if (!findEdgeBetween(nodeA.NodeID, nodeB.NodeID)) {
          const dist = shaft.type === 'elevator' ? 10 : 80;
          const cleanName = (shaft.name || 'SHAFT').replace(/[^a-zA-Z0-9]/g, '');
          const edgeID = `VERT_${cleanName}_${nodeA.NodeID}_${nodeB.NodeID}`;

          await axios.post('/api/edges', {
            EdgeID: edgeID,
            StartNodeID: nodeA.NodeID,
            EndNodeID: nodeB.NodeID,
            Distance: dist,
            EdgeType: shaft.type
          });
          createdCount++;
        }
      }

      showToast(`Connected ${createdCount} missing links for ${shaft.name}`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error connecting shaft: ' + (err.message || String(err)), 'error');
    }
  };

  // Disconnect all floor levels in a shaft
  const handleDisconnectEntireShaft = async (shaft) => {
    try {
      let removedCount = 0;
      for (let i = 0; i < shaft.nodes.length - 1; i++) {
        const nodeA = shaft.nodes[i];
        const nodeB = shaft.nodes[i + 1];
        const existing = findEdgeBetween(nodeA.NodeID, nodeB.NodeID);
        if (existing) {
          await axios.delete(`/api/edges/${existing._id}`);
          removedCount++;
        }
      }

      showToast(`Removed ${removedCount} links for ${shaft.name}`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error disconnecting shaft: ' + (err.message || String(err)), 'error');
    }
  };

  // Master 1-Click: Auto-connect all shafts across all floors
  const handleAutoConnectAllShafts = async () => {
    try {
      setLoading(true);
      let totalCreated = 0;

      for (const shaft of shafts) {
        for (let i = 0; i < shaft.nodes.length - 1; i++) {
          const nodeA = shaft.nodes[i];
          const nodeB = shaft.nodes[i + 1];

          if (!findEdgeBetween(nodeA.NodeID, nodeB.NodeID)) {
            const dist = shaft.type === 'elevator' ? 10 : 80;
            const cleanName = (shaft.name || 'SHAFT').replace(/[^a-zA-Z0-9]/g, '');
            const edgeID = `VERT_${cleanName}_${nodeA.NodeID}_${nodeB.NodeID}`;

            await axios.post('/api/edges', {
              EdgeID: edgeID,
              StartNodeID: nodeA.NodeID,
              EndNodeID: nodeB.NodeID,
              Distance: dist,
              EdgeType: shaft.type
            });
            totalCreated++;
          }
        }
      }

      showToast(`Success! Auto-connected ${totalCreated} vertical links across all ${shafts.length} shafts.`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error during auto-connection: ' + (err.message || String(err)), 'error');
      setLoading(false);
    }
  };

  // Disconnect all vertical edges
  const handleDisconnectAllVertical = async () => {
    if (!window.confirm('Are you sure you want to delete ALL vertical inter-floor edges? This will disconnect multi-floor navigation until reconnected.')) {
      return;
    }

    try {
      setLoading(true);
      for (const edge of verticalEdges) {
        await axios.delete(`/api/edges/${edge._id}`);
      }
      showToast(`Removed all ${verticalEdges.length} vertical connections.`, 'info');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error removing vertical edges: ' + (err.message || String(err)), 'error');
      setLoading(false);
    }
  };

  // Submit manual connection
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualNodeA || !manualNodeB) {
      showToast('Please select both Start and End nodes.', 'error');
      return;
    }
    if (manualNodeA === manualNodeB) {
      showToast('Start and End nodes must be different!', 'error');
      return;
    }

    try {
      setIsSubmittingManual(true);
      const edgeID = `VERT_MANUAL_${manualNodeA}_${manualNodeB}_${Date.now()}`;
      await axios.post('/api/edges', {
        EdgeID: edgeID,
        StartNodeID: manualNodeA,
        EndNodeID: manualNodeB,
        Distance: Number(manualDistance) || 10,
        EdgeType: manualType
      });

      showToast(`Connected ${manualNodeA} to ${manualNodeB} (${manualType})!`, 'success');
      setManualNodeA('');
      setManualNodeB('');
      setIsSubmittingManual(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to create manual edge: ' + (err.response?.data?.message || err.message), 'error');
      setIsSubmittingManual(false);
    }
  };

  // Single edge delete confirmation
  const handleDeleteEdge = async (id) => {
    try {
      await axios.delete(`/api/edges/${id}`);
      showToast('Edge removed successfully', 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to delete edge: ' + (err.message || String(err)), 'error');
    }
  };

  // Route Test Simulation (Client-side Dijkstra using live edges & nodes)
  const handleRunRouteTest = () => {
    if (!testStartNode || !testEndNode) {
      showToast('Please select both a Start Node and Destination Node to simulate.', 'error');
      return;
    }

    // Build Graph
    const g = {};
    nodes.forEach(n => g[n.NodeID] = {});
    edges.forEach(e => {
      if (g[e.StartNodeID] && g[e.EndNodeID]) {
        g[e.StartNodeID][e.EndNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
        g[e.EndNodeID][e.StartNodeID] = { distance: e.Distance, type: e.EdgeType || 'walkway' };
      }
    });

    // Run Dijkstra
    const distances = {};
    const previous = {};
    const unvisited = new Set();

    nodes.forEach(n => {
      distances[n.NodeID] = Infinity;
      previous[n.NodeID] = null;
      unvisited.add(n.NodeID);
    });

    distances[testStartNode] = 0;

    while (unvisited.size > 0) {
      let curr = null;
      let minD = Infinity;
      for (const node of unvisited) {
        if (distances[node] < minD) {
          minD = distances[node];
          curr = node;
        }
      }

      if (curr === null || curr === testEndNode) break;
      unvisited.delete(curr);

      for (const neighbor in g[curr]) {
        if (!unvisited.has(neighbor)) continue;
        const edge = g[curr][neighbor];
        if (testAccessible && edge.type === 'stairs') continue;

        const newDist = distances[curr] + edge.distance;
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          previous[neighbor] = curr;
        }
      }
    }

    if (distances[testEndNode] === Infinity) {
      setTestResult({
        success: false,
        message: 'No route found between these locations. Check if horizontal corridor edges and vertical shaft edges are connected.'
      });
      return;
    }

    // Backtrack path
    const path = [];
    let cur = testEndNode;
    while (cur !== null) {
      path.unshift(cur);
      cur = previous[cur];
    }

    // Build step breakdown
    const steps = [];
    for (let i = 0; i < path.length - 1; i++) {
      const nA = nodeMap.get(path[i]);
      const nB = nodeMap.get(path[i + 1]);
      const edge = g[path[i]][path[i + 1]];
      const isInterFloor = String(nA?.Floor) !== String(nB?.Floor);

      steps.push({
        from: nA,
        to: nB,
        distance: edge.distance,
        type: edge.type,
        isInterFloor
      });
    }

    setTestResult({
      success: true,
      totalDistance: distances[testEndNode],
      pathNodes: path.map(id => nodeMap.get(id)),
      steps
    });
  };

  // Filtered vertical edges for table search
  const filteredEdges = useMemo(() => {
    return verticalEdges.filter(e => {
      const nA = nodeMap.get(e.StartNodeID);
      const nB = nodeMap.get(e.EndNodeID);
      const str = `${e.EdgeID} ${e.StartNodeID} ${e.EndNodeID} ${e.EdgeType} ${nA?.Name || ''} ${nB?.Name || ''}`.toLowerCase();
      return str.includes(searchTerm.toLowerCase());
    });
  }, [verticalEdges, nodeMap, searchTerm]);

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1100,
          backgroundColor: notification.type === 'error' ? '#d93025' : (notification.type === 'info' ? '#1a73e8' : '#137333'),
          color: 'white', padding: '14px 24px', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px',
          fontWeight: '500', fontSize: '14px', animation: 'fadeIn 0.3s'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            {notification.type === 'error' ? 'error' : (notification.type === 'info' ? 'info' : 'check_circle')}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ backgroundColor: '#fce8eb', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ color: '#e31837', fontSize: '28px' }}>elevator</span>
            </div>
            <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', margin: 0 }}>
              Stairs & Elevators (Vertical Transitions)
            </h2>
          </div>
          <p style={{ margin: 0, color: '#5f6368', fontSize: '14px', maxWidth: '750px', lineHeight: '1.5' }}>
            Manage multi-floor connections across Ramanujan Block. Connect, edit, and fine-tune weights for elevator shafts and stairwells so Dijkstra pathfinding and turn-by-turn voice navigation can seamlessly guide visitors across Ground, 1st, and 2nd Floors.
          </p>
        </div>

        {/* Global Master Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleAutoConnectAllShafts}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#e31837', color: 'white', border: 'none',
              padding: '12px 20px', borderRadius: '10px', fontWeight: '600',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(227,24,55,0.25)',
              fontSize: '14px', transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bolt</span>
            Auto-Connect All Shafts (1-Click)
          </button>

          <button
            onClick={fetchData}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'white', color: '#3c4043', border: '1px solid #dadce0',
              padding: '12px 16px', borderRadius: '10px', fontWeight: '500',
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Identified Shafts */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#e8eaf6', padding: '12px', borderRadius: '12px', display: 'flex', color: '#3f51b5' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>domain</span>
          </div>
          <div>
            <div style={{ color: '#5f6368', fontSize: '13px', fontWeight: '500' }}>Vertical Shafts</div>
            <div style={{ color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.totalShafts} Shafts</div>
          </div>
        </div>

        {/* Active Vertical Edges */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#e6f4ea', padding: '12px', borderRadius: '12px', display: 'flex', color: '#137333' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>swap_vert</span>
          </div>
          <div>
            <div style={{ color: '#5f6368', fontSize: '13px', fontWeight: '500' }}>Active Vertical Edges</div>
            <div style={{ color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.verticalEdgesCount} Edges</div>
          </div>
        </div>

        {/* Health / Connected Status */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: stats.percentConnected === 100 ? '#e6f4ea' : '#fef7e0', padding: '12px', borderRadius: '12px', display: 'flex', color: stats.percentConnected === 100 ? '#137333' : '#b06000' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              {stats.percentConnected === 100 ? 'verified' : 'pending_actions'}
            </span>
          </div>
          <div>
            <div style={{ color: '#5f6368', fontSize: '13px', fontWeight: '500' }}>Connection Health</div>
            <div style={{ color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>
              {stats.connectedPairs} / {stats.totalPossiblePairs} ({stats.percentConnected}%)
            </div>
          </div>
        </div>

        {/* Quick Reset Button */}
        <div style={{ background: 'white', padding: '16px 20px', borderRadius: '14px', border: '1px solid #dadce0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: '#5f6368', marginBottom: '8px' }}>Danger Zone</span>
          <button
            onClick={handleDisconnectAllVertical}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #fce8e6',
              background: '#fef3f2', color: '#d93025', cursor: 'pointer', fontSize: '13px',
              fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link_off</span>
            Disconnect All Vertical
          </button>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #dadce0', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('shafts')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'shafts' ? '3px solid #e31837' : '3px solid transparent',
            color: activeTab === 'shafts' ? '#e31837' : '#5f6368',
            fontWeight: activeTab === 'shafts' ? '600' : '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>apartment</span>
          Vertical Shafts ({shafts.length})
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'manual' ? '3px solid #e31837' : '3px solid transparent',
            color: activeTab === 'manual' ? '#e31837' : '#5f6368',
            fontWeight: activeTab === 'manual' ? '600' : '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_link</span>
          Custom Node Linker
        </button>

        <button
          onClick={() => setActiveTab('table')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'table' ? '3px solid #e31837' : '3px solid transparent',
            color: activeTab === 'table' ? '#e31837' : '#5f6368',
            fontWeight: activeTab === 'table' ? '600' : '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>table_chart</span>
          Active Vertical Edges ({verticalEdges.length})
        </button>

        <button
          onClick={() => setActiveTab('test')}
          style={{
            padding: '12px 20px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'test' ? '3px solid #e31837' : '3px solid transparent',
            color: activeTab === 'test' ? '#e31837' : '#5f6368',
            fontWeight: activeTab === 'test' ? '600' : '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>directions_walk</span>
          Route Simulation Tester
        </button>
      </div>

      {/* TAB 1: VERTICAL SHAFTS GRID */}
      {activeTab === 'shafts' && (
        <div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>Loading vertical shafts...</div>
          ) : shafts.length === 0 ? (
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #dadce0', textAlign: 'center', color: '#5f6368' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#dadce0', marginBottom: '12px' }}>info</span>
              <h3 style={{ margin: '0 0 8px 0', color: '#3c4043' }}>No Vertical Nodes Detected</h3>
              <p style={{ margin: 0 }}>Ensure your nodes have Type set to 'Stairs' or 'Elevator', or names containing Lift or Staircase.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {shafts.map(shaft => {
                const isElevator = shaft.type === 'elevator';
                const badgeColor = isElevator ? { bg: '#e8eaf6', text: '#3f51b5', border: '#c5cae9' } : { bg: '#f3e5f5', text: '#8e24aa', border: '#e1bee7' };
                const icon = isElevator ? 'elevator' : 'stairs';

                // Check connectivity of this shaft
                let pairsConnected = 0;
                for (let i = 0; i < shaft.nodes.length - 1; i++) {
                  if (findEdgeBetween(shaft.nodes[i].NodeID, shaft.nodes[i + 1].NodeID)) {
                    pairsConnected++;
                  }
                }
                const isFullyConnected = shaft.nodes.length > 1 && pairsConnected === shaft.nodes.length - 1;

                return (
                  <div key={shaft.name} style={{
                    background: 'white', borderRadius: '16px', border: '1px solid #dadce0',
                    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column'
                  }}>
                    {/* Shaft Card Header */}
                    <div style={{
                      padding: '16px 20px', borderBottom: '1px solid #f1f3f4',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      backgroundColor: '#fafbfc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          backgroundColor: badgeColor.bg, color: badgeColor.text,
                          padding: '10px', borderRadius: '10px', display: 'flex', border: `1px solid ${badgeColor.border}`
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '17px', color: '#202124', fontWeight: 'bold' }}>{shaft.name}</h3>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                              fontSize: '11px', textTransform: 'uppercase', fontWeight: '600',
                              backgroundColor: badgeColor.bg, color: badgeColor.text, padding: '2px 8px', borderRadius: '12px'
                            }}>
                              {isElevator ? 'Elevator Shaft' : 'Stairwell'}
                            </span>
                            <span style={{
                              fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '12px',
                              backgroundColor: isFullyConnected ? '#e6f4ea' : '#fef7e0',
                              color: isFullyConnected ? '#137333' : '#b06000'
                            }}>
                              {isFullyConnected ? 'All Floors Linked' : `${pairsConnected}/${shaft.nodes.length - 1} Linked`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shaft Vertical Stack Levels */}
                    <div style={{ padding: '20px', flex: 1, backgroundColor: '#ffffff' }}>
                      {/* Render nodes reversed so Floor 2 is at top, Ground is at bottom */}
                      {[...shaft.nodes].reverse().map((node, reverseIdx) => {
                        const originalIdx = shaft.nodes.length - 1 - reverseIdx;
                        const floorBadge = getFloorBadgeColor(node.Floor);
                        const nextLowerNode = originalIdx > 0 ? shaft.nodes[originalIdx - 1] : null;
                        const edgeBelow = nextLowerNode ? findEdgeBetween(node.NodeID, nextLowerNode.NodeID) : null;

                        return (
                          <div key={node.NodeID}>
                            {/* Floor Node Level Row */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', borderRadius: '10px', border: '1px solid #e8eaed',
                              backgroundColor: '#f8f9fa'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px',
                                  backgroundColor: floorBadge.bg, color: floorBadge.text
                                }}>
                                  {getFloorName(node.Floor)}
                                </span>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#202124' }}>
                                      {node.Name}
                                    </span>
                                    <button
                                      title="Edit Node details"
                                      onClick={() => handleOpenEditNode(node)}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '2px', display: 'flex', color: '#5f6368'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span>
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#5f6368', fontFamily: 'monospace' }}>
                                    ID: {node.NodeID}
                                  </div>
                                </div>
                              </div>

                              <div style={{ fontSize: '11px', color: '#70757a' }}>
                                X:{node.X}, Y:{node.Y}
                              </div>
                            </div>

                            {/* Vertical Edge Connector (if there is a floor below) */}
                            {nextLowerNode && (
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                margin: '8px 0', padding: '8px 12px', borderRadius: '8px',
                                border: edgeBelow ? '1px solid #ceead6' : '1px dashed #f6aea9',
                                backgroundColor: edgeBelow ? '#f6fbf7' : '#fff8f7'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="material-symbols-outlined" style={{
                                    fontSize: '18px', color: edgeBelow ? '#137333' : '#d93025'
                                  }}>
                                    {edgeBelow ? 'sync_alt' : 'link_off'}
                                  </span>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: edgeBelow ? '#137333' : '#d93025' }}>
                                      {edgeBelow ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                          Connected ({edgeBelow.EdgeType}, Dist: {edgeBelow.Distance})
                                          <button
                                            title="Quick Edit Connection"
                                            onClick={() => handleOpenEditEdge(edgeBelow)}
                                            style={{
                                              background: 'none', border: 'none', color: '#1a73e8',
                                              cursor: 'pointer', padding: 0, display: 'inline-flex'
                                            }}
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                          </button>
                                        </span>
                                      ) : 'Missing Inter-Floor Link'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#5f6368' }}>
                                      {getFloorName(nextLowerNode.Floor)} ↕ {getFloorName(node.Floor)}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {edgeBelow ? (
                                    <>
                                      <button
                                        onClick={() => handleOpenEditEdge(edgeBelow)}
                                        style={{
                                          padding: '4px 10px', fontSize: '11px', borderRadius: '6px',
                                          border: '1px solid #dadce0', background: 'white', color: '#1a73e8',
                                          cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px'
                                        }}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>edit</span>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDisconnectPair(node, nextLowerNode)}
                                        style={{
                                          padding: '4px 10px', fontSize: '11px', borderRadius: '6px',
                                          border: '1px solid #dadce0', background: 'white', color: '#d93025',
                                          cursor: 'pointer', fontWeight: '600'
                                        }}
                                      >
                                        Disconnect
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleConnectPair(nextLowerNode, node, shaft.type)}
                                      style={{
                                        padding: '4px 12px', fontSize: '11px', borderRadius: '6px',
                                        border: 'none', background: '#137333', color: 'white',
                                        cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                                      }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                                      Connect
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Shaft Card Footer Actions */}
                    <div style={{
                      padding: '12px 20px', borderTop: '1px solid #f1f3f4',
                      backgroundColor: '#fafbfc', display: 'flex', justifyContent: 'flex-end', gap: '8px'
                    }}>
                      <button
                        onClick={() => handleDisconnectEntireShaft(shaft)}
                        style={{
                          padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
                          border: '1px solid #dadce0', background: 'white', color: '#5f6368',
                          cursor: 'pointer', fontWeight: '500'
                        }}
                      >
                        Disconnect All
                      </button>

                      <button
                        onClick={() => handleConnectEntireShaft(shaft)}
                        disabled={isFullyConnected}
                        style={{
                          padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
                          border: 'none', background: isFullyConnected ? '#e8eaed' : '#e31837',
                          color: isFullyConnected ? '#80868b' : 'white', cursor: isFullyConnected ? 'default' : 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {isFullyConnected ? 'Fully Connected' : 'Connect All Levels'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL CUSTOM NODE LINKER */}
      {activeTab === 'manual' && (
        <div style={{ background: 'white', padding: '28px', borderRadius: '16px', border: '1px solid #dadce0', maxWidth: '850px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#202124', fontWeight: 'bold' }}>
            Custom Cross-Floor Edge Linker
          </h3>
          <p style={{ margin: '0 0 24px 0', color: '#5f6368', fontSize: '14px' }}>
            Create an arbitrary vertical connection between any node on Floor A and any node on Floor B. Useful for connecting non-standard staircases, ramps, or exterior walkways across levels.
          </p>

          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              
              {/* Floor A Side */}
              <div style={{ border: '1px solid #dadce0', padding: '16px', borderRadius: '12px', backgroundColor: '#fafbfc' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#3c4043', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#1a73e8' }}>trip_origin</span>
                  Side A (Lower Floor / Node)
                </h4>

                <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>Select Floor</label>
                <select
                  value={manualFloorA}
                  onChange={e => { setManualFloorA(e.target.value); setManualNodeA(''); }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', marginBottom: '12px', fontFamily: 'inherit' }}
                >
                  <option value="-1">Ground Floor (-1)</option>
                  <option value="0">First Floor (0)</option>
                  <option value="1">Second Floor (1)</option>
                </select>

                <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>Select Node</label>
                <select
                  value={manualNodeA}
                  onChange={e => setManualNodeA(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="">-- Choose Node on Floor {getFloorName(manualFloorA)} --</option>
                  {nodes
                    .filter(n => String(n.Floor) === String(manualFloorA))
                    .sort((a, b) => a.Name.localeCompare(b.Name))
                    .map(n => (
                      <option key={n.NodeID} value={n.NodeID}>
                        {n.Name} ({n.NodeID}) - [{n.Type}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Floor B Side */}
              <div style={{ border: '1px solid #dadce0', padding: '16px', borderRadius: '12px', backgroundColor: '#fafbfc' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#3c4043', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#e31837' }}>location_on</span>
                  Side B (Upper Floor / Node)
                </h4>

                <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>Select Floor</label>
                <select
                  value={manualFloorB}
                  onChange={e => { setManualFloorB(e.target.value); setManualNodeB(''); }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', marginBottom: '12px', fontFamily: 'inherit' }}
                >
                  <option value="-1">Ground Floor (-1)</option>
                  <option value="0">First Floor (0)</option>
                  <option value="1">Second Floor (1)</option>
                </select>

                <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>Select Node</label>
                <select
                  value={manualNodeB}
                  onChange={e => setManualNodeB(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="">-- Choose Node on Floor {getFloorName(manualFloorB)} --</option>
                  {nodes
                    .filter(n => String(n.Floor) === String(manualFloorB))
                    .sort((a, b) => a.Name.localeCompare(b.Name))
                    .map(n => (
                      <option key={n.NodeID} value={n.NodeID}>
                        {n.Name} ({n.NodeID}) - [{n.Type}]
                      </option>
                    ))}
                </select>
              </div>

            </div>

            {/* Link Properties */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#3c4043', marginBottom: '6px' }}>Transition Type</label>
                <select
                  value={manualType}
                  onChange={e => {
                    setManualType(e.target.value);
                    if (e.target.value === 'elevator') setManualDistance(10);
                    else if (e.target.value === 'stairs') setManualDistance(80);
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="elevator">Elevator (Accessible)</option>
                  <option value="stairs">Stairs</option>
                  <option value="walkway">Walkway / Ramp</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#3c4043', marginBottom: '6px' }}>Distance / Weight Penalty</label>
                <input
                  type="number"
                  value={manualDistance}
                  onChange={e => setManualDistance(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '11px', color: '#5f6368' }}>Recommended: 10 for elevators, 80 for stairs</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingManual}
              style={{
                backgroundColor: '#e31837', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: '8px', fontWeight: '600',
                cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_link</span>
              {isSubmittingManual ? 'Creating Edge...' : 'Create Vertical Edge'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ACTIVE VERTICAL EDGES TABLE */}
      {activeTab === 'table' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflow: 'hidden' }}>
          
          {/* Table Search Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: '#5f6368' }}>search</span>
            <input
              type="text"
              placeholder="Search vertical edges by ID, Node Name, Node ID, or Type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: '#3c4043' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                  <th style={thStyle}>Edge ID</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>From (Lower Level)</th>
                  <th style={thStyle}>Direction</th>
                  <th style={thStyle}>To (Upper Level)</th>
                  <th style={thStyle}>Weight/Dist</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>Loading edges...</td></tr>
                ) : filteredEdges.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#5f6368' }}>
                      No active vertical edges found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredEdges.map(edge => {
                    const nodeA = nodeMap.get(edge.StartNodeID);
                    const nodeB = nodeMap.get(edge.EndNodeID);
                    const isElevator = edge.EdgeType === 'elevator';

                    return (
                      <tr key={edge._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                        <td style={tdStyle}>
                          <strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>{edge.EdgeID}</strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px',
                            backgroundColor: isElevator ? '#e8eaf6' : '#f3e5f5',
                            color: isElevator ? '#3f51b5' : '#8e24aa',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              {isElevator ? 'elevator' : 'stairs'}
                            </span>
                            {isElevator ? 'Elevator' : 'Stairs'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <span style={{
                              fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: getFloorBadgeColor(nodeA?.Floor).bg,
                              color: getFloorBadgeColor(nodeA?.Floor).text, marginRight: '6px'
                            }}>
                              {getFloorName(nodeA?.Floor)}
                            </span>
                            <strong>{nodeA?.Name || edge.StartNodeID}</strong>
                            <div style={{ fontSize: '11px', color: '#70757a', fontFamily: 'monospace' }}>{edge.StartNodeID}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span className="material-symbols-outlined" style={{ color: '#137333', fontSize: '20px' }}>sync_alt</span>
                        </td>
                        <td style={tdStyle}>
                          <div>
                            <span style={{
                              fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: getFloorBadgeColor(nodeB?.Floor).bg,
                              color: getFloorBadgeColor(nodeB?.Floor).text, marginRight: '6px'
                            }}>
                              {getFloorName(nodeB?.Floor)}
                            </span>
                            <strong>{nodeB?.Name || edge.EndNodeID}</strong>
                            <div style={{ fontSize: '11px', color: '#70757a', fontFamily: 'monospace' }}>{edge.EndNodeID}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '600' }}>{edge.Distance}</span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditEdge(edge)}
                              style={{
                                backgroundColor: 'white', color: '#1a73e8',
                                border: '1px solid #dadce0', padding: '6px 12px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setDeleteModalId(edge._id);
                                setDeleteModalName(`${edge.EdgeID} (${nodeA?.Name} ↔ ${nodeB?.Name})`);
                              }}
                              style={{
                                backgroundColor: 'transparent', color: '#d93025',
                                border: '1px solid #fce8e6', padding: '6px 12px', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                              Disconnect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: ROUTE SIMULATION TESTER */}
      {activeTab === 'test' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Controls Box */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#202124', fontWeight: 'bold' }}>
              Multi-Floor Route Simulator
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#5f6368', fontSize: '13px' }}>
              Test how Dijkstra computes shortest paths across floors. Verify that selecting "Avoid Stairs" directs travelers into elevators rather than stairwells.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', fontWeight: '600', marginBottom: '6px' }}>
                Start Location (From)
              </label>
              <select
                value={testStartNode}
                onChange={e => setTestStartNode(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
              >
                <option value="">-- Choose Origin Node --</option>
                {nodes
                  .filter(n => n.Type !== 'Junction')
                  .sort((a, b) => a.Name.localeCompare(b.Name))
                  .map(n => (
                    <option key={n.NodeID} value={n.NodeID}>
                      [{getFloorName(n.Floor)}] {n.Name} ({n.NodeID})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#5f6368', fontWeight: '600', marginBottom: '6px' }}>
                Destination (To)
              </label>
              <select
                value={testEndNode}
                onChange={e => setTestEndNode(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
              >
                <option value="">-- Choose Destination Node --</option>
                {nodes
                  .filter(n => n.Type !== 'Junction')
                  .sort((a, b) => a.Name.localeCompare(b.Name))
                  .map(n => (
                    <option key={n.NodeID} value={n.NodeID}>
                      [{getFloorName(n.Floor)}] {n.Name} ({n.NodeID})
                    </option>
                  ))}
              </select>
            </div>

            {/* Accessibility Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: '10px', backgroundColor: '#f8f9fa',
              border: '1px solid #dadce0', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#1a73e8' }}>accessible</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#3c4043' }}>Wheelchair / Avoid Stairs</div>
                  <div style={{ fontSize: '11px', color: '#5f6368' }}>Force Dijkstra to use Elevators only</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={testAccessible}
                onChange={e => setTestAccessible(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={handleRunRouteTest}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#e31837', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>route</span>
              Simulate Dijkstra Path
            </button>
          </div>

          {/* Test Results Output */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#3c4043', fontWeight: 'bold' }}>Simulation Output</h4>

            {!testResult ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5f6368', border: '1px dashed #dadce0', borderRadius: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#dadce0', marginBottom: '8px' }}>analytics</span>
                <p style={{ margin: 0, fontSize: '13px' }}>Select Start and End locations and click Simulate to trace the multi-floor route.</p>
              </div>
            ) : !testResult.success ? (
              <div style={{ padding: '20px', backgroundColor: '#fef3f2', border: '1px solid #fce8e6', borderRadius: '12px', color: '#d93025' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span className="material-symbols-outlined">error</span>
                  Route Calculation Failed
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>{testResult.message}</p>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '14px 16px', backgroundColor: '#e6f4ea', border: '1px solid #ceead6',
                  borderRadius: '10px', color: '#137333', marginBottom: '16px'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Path Found Successfully!</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Total Distance: <strong>{testResult.totalDistance} units</strong> | Steps: <strong>{testResult.steps.length} segments</strong>
                  </div>
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {testResult.steps.map((st, idx) => {
                    const isVertical = st.isInterFloor;
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        marginBottom: '12px', padding: '10px 12px', borderRadius: '8px',
                        backgroundColor: isVertical ? '#fce8eb' : '#f8f9fa',
                        border: isVertical ? '1px solid #fad2cf' : '1px solid #f1f3f4'
                      }}>
                        <div style={{
                          backgroundColor: isVertical ? '#e31837' : '#dadce0',
                          color: isVertical ? 'white' : '#3c4043',
                          width: '24px', height: '24px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: isVertical ? '#e31837' : '#202124' }}>
                            {isVertical ? `Take ${st.type === 'elevator' ? 'Elevator' : 'Stairs'} from ${getFloorName(st.from?.Floor)} to ${getFloorName(st.to?.Floor)}` : `Walk from ${st.from?.Name} to ${st.to?.Name}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '2px' }}>
                            {st.from?.NodeID} ➔ {st.to?.NodeID} ({st.type}, dist: {st.distance})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* EDIT VERTICAL EDGE MODAL */}
      {editingEdge && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px 28px',
            width: '480px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#e8f0fe', padding: '8px', borderRadius: '8px', display: 'flex', color: '#1a73e8' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>tune</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#202124', fontWeight: 'bold' }}>
                    Edit Vertical Connection
                  </h3>
                  <div style={{ fontSize: '12px', color: '#5f6368', fontFamily: 'monospace' }}>
                    Edge ID: {editingEdge.EdgeID}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingEdge(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', display: 'flex' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdgeEdit}>
              {/* Connected Nodes Summary */}
              <div style={{
                backgroundColor: '#f8f9fa', padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #dadce0', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: getFloorBadgeColor(nodeMap.get(editingEdge.StartNodeID)?.Floor).bg,
                    color: getFloorBadgeColor(nodeMap.get(editingEdge.StartNodeID)?.Floor).text, marginRight: '4px'
                  }}>
                    {getFloorName(nodeMap.get(editingEdge.StartNodeID)?.Floor)}
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#202124', marginTop: '2px' }}>
                    {nodeMap.get(editingEdge.StartNodeID)?.Name || editingEdge.StartNodeID}
                  </div>
                </div>

                <span className="material-symbols-outlined" style={{ color: '#137333', fontSize: '20px' }}>sync_alt</span>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: getFloorBadgeColor(nodeMap.get(editingEdge.EndNodeID)?.Floor).bg,
                    color: getFloorBadgeColor(nodeMap.get(editingEdge.EndNodeID)?.Floor).text, marginLeft: '4px'
                  }}>
                    {getFloorName(nodeMap.get(editingEdge.EndNodeID)?.Floor)}
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#202124', marginTop: '2px' }}>
                    {nodeMap.get(editingEdge.EndNodeID)?.Name || editingEdge.EndNodeID}
                  </div>
                </div>
              </div>

              {/* Transition Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3c4043', marginBottom: '6px' }}>
                  Transition Type
                </label>
                <select
                  value={edgeEditFormData.EdgeType}
                  onChange={e => setEdgeEditFormData({ ...edgeEditFormData, EdgeType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="elevator">Elevator (Wheelchair Accessible)</option>
                  <option value="stairs">Stairs</option>
                  <option value="walkway">Walkway / Ramp</option>
                </select>
              </div>

              {/* Distance / Weight */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3c4043', marginBottom: '6px' }}>
                  Distance / Weight Penalty
                </label>
                <input
                  type="number"
                  value={edgeEditFormData.Distance}
                  onChange={e => setEdgeEditFormData({ ...edgeEditFormData, Distance: Number(e.target.value) })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                />
                <span style={{ fontSize: '11px', color: '#5f6368', marginTop: '4px', display: 'block' }}>
                  Lower distance = preferred path in Dijkstra. Standard: 10 for elevators, 80 for stairs.
                </span>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingEdge(null)}
                  style={{
                    padding: '10px 18px', borderRadius: '8px', border: '1px solid #dadce0',
                    background: 'white', color: '#3c4043', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdge}
                  style={{
                    padding: '10px 22px', borderRadius: '8px', border: 'none',
                    background: '#e31837', color: 'white', cursor: 'pointer', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  {isSavingEdge ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NODE MODAL */}
      {editingNode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px 28px',
            width: '480px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#fce8eb', padding: '8px', borderRadius: '8px', display: 'flex', color: '#e31837' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>edit_location</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#202124', fontWeight: 'bold' }}>
                    Edit Node Details
                  </h3>
                  <div style={{ fontSize: '12px', color: '#5f6368', fontFamily: 'monospace' }}>
                    Node ID: {editingNode.NodeID}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingNode(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', display: 'flex' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNodeEdit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3c4043', marginBottom: '6px' }}>
                  Node Name (e.g. LIFT 1, STAIRCASE 1)
                </label>
                <input
                  type="text"
                  value={nodeEditFormData.Name}
                  onChange={e => setNodeEditFormData({ ...nodeEditFormData, Name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3c4043', marginBottom: '6px' }}>
                  Node Type
                </label>
                <select
                  value={nodeEditFormData.Type}
                  onChange={e => setNodeEditFormData({ ...nodeEditFormData, Type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="Elevator">Elevator</option>
                  <option value="Stairs">Stairs</option>
                  <option value="Room">Room</option>
                  <option value="Office">Office</option>
                  <option value="Lab">Lab</option>
                  <option value="Washroom">Washroom</option>
                  <option value="Junction">Junction</option>
                </select>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3c4043', marginBottom: '6px' }}>
                  Floor Level
                </label>
                <select
                  value={nodeEditFormData.Floor}
                  onChange={e => setNodeEditFormData({ ...nodeEditFormData, Floor: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #dadce0', fontFamily: 'inherit' }}
                >
                  <option value="-1">Ground Floor (-1)</option>
                  <option value="0">First Floor (0)</option>
                  <option value="1">Second Floor (1)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  style={{
                    padding: '10px 18px', borderRadius: '8px', border: '1px solid #dadce0',
                    background: 'white', color: '#3c4043', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNode}
                  style={{
                    padding: '10px 22px', borderRadius: '8px', border: 'none',
                    background: '#e31837', color: 'white', cursor: 'pointer', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  {isSavingNode ? 'Saving...' : 'Save Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteModalId}
        itemName={deleteModalName}
        onCancel={() => { setDeleteModalId(null); setDeleteModalName(''); }}
        onConfirm={() => {
          handleDeleteEdge(deleteModalId);
          setDeleteModalId(null);
          setDeleteModalName('');
        }}
      />

    </div>
  );
}

const thStyle = { padding: '14px 18px', color: '#5f6368', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 18px', color: '#3c4043', fontSize: '13px', whiteSpace: 'nowrap' };
