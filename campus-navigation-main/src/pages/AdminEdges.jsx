import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminEdges() {
  const [edgeList, setEdgeList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchEdges(); }, []);

  const fetchEdges = async () => {
    const res = await axios.get('/api/edges');
    setEdgeList(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (typeof api !== 'undefined' ? api : axios).put(`/api/edges/${editingId}`, formData);
      } else {
        await (typeof api !== 'undefined' ? api : axios).post(`/api/edges`, formData);
      }
      setEditingId(null);
      setFormData({ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' });
      fetchEdges();
    } catch (error) {
      console.error(error);
    }
  };

  
  const handleEdit = (item) => {
    setEditingId(item._id);
    const payload = { ...item };
    delete payload._id;
    delete payload.__v;
    if (payload.StartTime) payload.StartTime = payload.StartTime.slice(0, 16);
    if (payload.EndTime) payload.EndTime = payload.EndTime.slice(0, 16);
    setFormData(payload);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ EdgeID: '', StartNodeID: '', EndNodeID: '', Distance: '', EdgeType: 'walkway' });
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Delete this Edge?')) {
      await axios.delete(`/api/edges/${id}`);
      fetchEdges();
    }
  };

  
  const filteredList = edgeList.filter(item => 
    (item.EdgeID && item.EdgeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.StartNodeID && item.StartNodeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.EndNodeID && item.EndNodeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.EdgeType && item.EdgeType.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Edges (Connections)</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>{editingId ? 'Edit Edge' : 'Add New Edge'}</h3>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId && <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>}
              <button type="submit" style={btnStyle}>{editingId ? 'Update Edge' : 'Add Edge'}</button>
            </div>
          </div>
        </form>
      </div>

      
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#5f6368', marginRight: '8px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search edges by ID, Start, End, or Type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', width: '100%', color: '#3c4043' }}
          />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
            {loading ? <tr><td colSpan="5">Loading...</td></tr> : filteredList.map(edge => (
              <tr key={edge._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={tdStyle}><strong>{edge.EdgeID}</strong></td>
                <td style={tdStyle}>{edge.StartNodeID} {"->"} {edge.EndNodeID}</td>
                <td style={tdStyle}>{edge.Distance}</td>
                <td style={tdStyle}>{edge.EdgeType}</td>
                <td style={tdStyle}><div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(edge)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                          </button>
                          <button onClick={() => setDeleteModalId(edge._id)} style={deleteBtnStyle}>Delete</button>
                        </div></td>
              </tr>
            ))}
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan="10" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No results found matching your search.</td></tr>
              )}
            </tbody>
        </table>
      </div>
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




