import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminNodes() {
  const [nodeList, setNodeList] = useState([]);
  const [formData, setFormData] = useState({ NodeID: '', Name: '', Type: '', Floor: '0', X: '', Y: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const res = await axios.get('/api/nodes');
      setNodeList(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/nodes', formData);
      setFormData({ NodeID: '', Name: '', Type: '', Floor: '0', X: '', Y: '' });
      fetchNodes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this Node?')) {
      try {
        await axios.delete(`/api/nodes/${id}`);
        fetchNodes();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Nodes</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New Node</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Node ID (e.g., N001)" value={formData.NodeID} onChange={e => setFormData({...formData, NodeID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Node Name (e.g., Reception)" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Type (e.g., entrance, classroom)" value={formData.Type} onChange={e => setFormData({...formData, Type: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Floor (e.g., Ground)" value={formData.Floor} onChange={e => setFormData({...formData, Floor: e.target.value})} required style={inputStyle} />
          <input type="number" placeholder="X Coordinate (e.g., 420)" value={formData.X} onChange={e => setFormData({...formData, X: e.target.value})} required style={inputStyle} />
          <input type="number" placeholder="Y Coordinate (e.g., 300)" value={formData.Y} onChange={e => setFormData({...formData, Y: e.target.value})} required style={inputStyle} />
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnStyle}>Add Node</button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Floor</th>
              <th style={thStyle}>Coordinates</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>Loading...</td></tr>
            ) : nodeList.map(node => (
              <tr key={node._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={tdStyle}><strong>{node.NodeID}</strong></td>
                <td style={tdStyle}>{node.Name}</td>
                <td style={tdStyle}><span style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{node.Type}</span></td>
                <td style={tdStyle}>{node.Floor}</td>
                <td style={tdStyle}>X: {node.X}, Y: {node.Y}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(node._id)} style={deleteBtnStyle}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px 16px', border: '1px solid #dadce0', borderRadius: '8px', fontSize: '14px', fontFamily: "'Poppins', sans-serif" };
const btnStyle = { backgroundColor: '#e31837', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const thStyle = { padding: '16px 20px', color: '#5f6368', fontWeight: '600', fontSize: '14px' };
const tdStyle = { padding: '16px 20px', color: '#3c4043', fontSize: '14px' };
const deleteBtnStyle = { backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

