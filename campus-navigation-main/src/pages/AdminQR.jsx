import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminQR() {
  const [qrList, setQrList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ QRID: '', NodeID: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchQRs(); }, []);

  const fetchQRs = async () => {
    const res = await axios.get('/api/qr');
    setQrList(res.data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await (typeof api !== 'undefined' ? api : axios).put(`/api/qr/${editingId}`, formData);
      } else {
        await (typeof api !== 'undefined' ? api : axios).post(`/api/qr`, formData);
      }
      setEditingId(null);
      setFormData({ QRID: '', NodeID: '' });
      fetchQRs();
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
    setFormData({ QRID: '', NodeID: '' });
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Delete this QR Mapping?')) {
      await axios.delete(`/api/qr/${id}`);
      fetchQRs();
    }
  };

  
  const filteredList = qrList.filter(item => 
    (item.QRID && item.QRID.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.NodeID && item.NodeID.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage QR Codes</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New QR Code Mapping</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="QR ID (e.g., QR001)" value={formData.QRID} onChange={e => setFormData({...formData, QRID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Target Node ID (e.g., N001)" value={formData.NodeID} onChange={e => setFormData({...formData, NodeID: e.target.value})} required style={inputStyle} />
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId && <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>}
              <button type="submit" style={btnStyle}>{editingId ? 'Update QR Mapping' : 'Add QR Mapping'}</button>
            </div>
          </div>
        </form>
      </div>

      
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#5f6368', marginRight: '8px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search QR codes by QR ID or Node ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', width: '100%', color: '#3c4043' }}
          />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>QR ID</th>
              <th style={thStyle}>Mapped Node ID</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="3">Loading...</td></tr> : filteredList.map(qr => (
              <tr key={qr._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={tdStyle}><strong>{qr.QRID}</strong></td>
                <td style={tdStyle}><span style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{qr.NodeID}</span></td>
                <td style={tdStyle}><div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(qr)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                          </button>
                          <button onClick={() => setDeleteModalId(qr._id)} style={deleteBtnStyle}>Delete</button>
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



