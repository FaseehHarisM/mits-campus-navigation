import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

// Icon matching logic matching Navigate.jsx
const getIconData = (type) => {
  let icon = "room";
  let color = "#4285F4";
  
  if (type === 'Washroom') { icon = "wc"; color = "#607d8b"; }
  else if (type === 'Elevator') { icon = "elevator"; color = "#795548"; }
  else if (type === 'Stairs') { icon = "stairs"; color = "#9e9e9e"; }
  else if (type === 'Cafeteria') { icon = "restaurant"; color = "#F57C00"; }
  else if (type === 'Library') { icon = "local_library"; color = "#34A853"; }
  else if (type === 'Office') { icon = "work"; color = "#8E24AA"; }
  else if (type === 'Hall') { icon = "stadium"; color = "#FABC04"; }
  else if (type === 'Classroom') { icon = "school"; color = "#0F9D58"; }
  else if (type === 'Lab') { icon = "science"; color = "#DB4437"; }
  else if (type === 'Server') { icon = "dns"; color = "#3F51B5"; }
  
  return { icon, color };
};

export default function AdminNodes() {
  const [nodeList, setNodeList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [formData, setFormData] = useState({ NodeID: '', Name: '', Type: 'Room', Floor: '0', X: '', Y: '' });
  const [editingId, setEditingId] = useState(null);
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
      if (editingId) {
        await axios.put(`/api/nodes/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post('/api/nodes', formData);
      }
      setFormData({ NodeID: '', Name: '', Type: 'Room', Floor: '0', X: '', Y: '' });
      fetchNodes();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (node) => {
    setEditingId(node._id);
    setFormData({
      NodeID: node.NodeID,
      Name: node.Name,
      Type: node.Type || 'Room',
      Floor: node.Floor,
      X: node.X,
      Y: node.Y
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ NodeID: '', Name: '', Type: 'Room', Floor: '0', X: '', Y: '' });
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Delete this Node?')) {
      try {
        await axios.delete(`/api/nodes/${id}`);
        fetchNodes();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const PRESET_TYPES = [
    'Room', 'Washroom', 'Elevator', 'Stairs', 'Cafeteria', 
    'Library', 'Office', 'Hall', 'Classroom', 'Lab', 'Server', 'Junction'
  ];

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Nodes</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>
          {editingId ? 'Edit Node' : 'Add New Node'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Node ID (e.g., N001)" value={formData.NodeID} onChange={e => setFormData({...formData, NodeID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Node Name (e.g., Reception)" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required style={inputStyle} />
          
          {/* Dropdown for Type so they don't have to guess */}
          <select value={formData.Type} onChange={e => setFormData({...formData, Type: e.target.value})} required style={inputStyle}>
            {PRESET_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <input type="text" placeholder="Floor (e.g., 0, 1)" value={formData.Floor} onChange={e => setFormData({...formData, Floor: e.target.value})} required style={inputStyle} />
          <input type="number" placeholder="X Coordinate (e.g., 420)" value={formData.X} onChange={e => setFormData({...formData, X: e.target.value})} required style={inputStyle} />
          <input type="number" placeholder="Y Coordinate (e.g., 300)" value={formData.Y} onChange={e => setFormData({...formData, Y: e.target.value})} required style={inputStyle} />
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{...btnStyle, backgroundColor: '#5f6368'}}>Cancel</button>
            )}
            <button type="submit" style={btnStyle}>{editingId ? 'Update Node' : 'Add Node'}</button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type & Icon</th>
              <th style={thStyle}>Floor</th>
              <th style={thStyle}>Coordinates</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>Loading...</td></tr>
            ) : nodeList.map(node => {
              const { icon, color } = getIconData(node.Type);
              return (
                <tr key={node._id} style={{ borderBottom: '1px solid #f1f3f4', backgroundColor: editingId === node._id ? '#fef7f7' : 'transparent' }}>
                  <td style={tdStyle}><strong>{node.NodeID}</strong></td>
                  <td style={tdStyle}>{node.Name}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '2px solid white'
                      }}>
                        <span className="material-symbols-outlined filled" style={{ color: 'white', fontSize: '16px' }}>
                          {icon}
                        </span>
                      </div>
                      <span style={{ fontWeight: '500', color: '#5f6368' }}>{node.Type}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>F{node.Floor}</td>
                  <td style={tdStyle}>X: {node.X}, Y: {node.Y}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(node)} style={editBtnStyle}>Edit</button>
                      <button onClick={() => setDeleteModalId(node._id)} style={deleteBtnStyle}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
const editBtnStyle = { backgroundColor: 'transparent', color: '#1a73e8', border: '1px solid #1a73e8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const deleteBtnStyle = { backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
