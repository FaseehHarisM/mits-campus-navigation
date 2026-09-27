import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminEdges() {
  const [edgeList, setEdgeList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [formData, setFormData] = useState({ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEdges(); }, []);

  const fetchEdges = async () => {
    const res = await axios.get('/api/edges');
    setEdgeList(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/edges', formData);
    setFormData({ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' });
    fetchEdges();
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Delete this Edge?')) {
      await axios.delete(`/api/edges/${id}`);
      fetchEdges();
    }
  };

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Edges (Connections)</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New Edge</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Edge ID (e.g., E001)" value={formData.EdgeID} onChange={e => setFormData({...formData, EdgeID: e.target.value})} required style={inputStyle} />
          <input type="number" placeholder="Distance/Weight (e.g., 5)" value={formData.Distance} onChange={e => setFormData({...formData, Distance: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Start Node ID (e.g., N001)" value={formData.StartNodeID} onChange={e => setFormData({...formData, StartNodeID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="End Node ID (e.g., N002)" value={formData.EndNodeID} onChange={e => setFormData({...formData, EndNodeID: e.target.value})} required style={inputStyle} />
          
          <select value={formData.EdgeType} onChange={e => setFormData({...formData, EdgeType: e.target.value})} style={inputStyle}>
            <option value="walkway">Walkway</option>
            <option value="stairs">Stairs</option>
            <option value="elevator">Elevator</option>
          </select>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnStyle}>Add Edge</button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>Edge ID</th>
              <th style={thStyle}>Path</th>
              <th style={thStyle}>Distance</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5">Loading...</td></tr> : edgeList.map(edge => (
              <tr key={edge._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={tdStyle}><strong>{edge.EdgeID}</strong></td>
                <td style={tdStyle}>{edge.StartNodeID} → {edge.EndNodeID}</td>
                <td style={tdStyle}>{edge.Distance}</td>
                <td style={tdStyle}>{edge.EdgeType}</td>
                <td style={tdStyle}><button onClick={() => setDeleteModalId(edge._id)} style={deleteBtnStyle}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DeleteModal 
        isOpen={!!deleteModalId} 
        onCancel={() => setDeleteModalId(null)}
        onConfirm={() => {
          handleDelete(deleteModalId);
          setDeleteModalId(null);
        }}
      />
</div>
  );
}

const inputStyle = { padding: '12px 16px', border: '1px solid #dadce0', borderRadius: '8px', fontSize: '14px', fontFamily: "'Poppins', sans-serif" };
const btnStyle = { backgroundColor: '#e31837', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const thStyle = { padding: '16px 20px', color: '#5f6368', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 20px', color: '#3c4043', fontSize: '14px', whiteSpace: 'nowrap' };
const deleteBtnStyle = { backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

