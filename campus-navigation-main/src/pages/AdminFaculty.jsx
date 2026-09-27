import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminFaculty() {
  const [facultyList, setFacultyList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [formData, setFormData] = useState({ Name: '', Department: '', RoomNodeID: '', Designation: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const res = await axios.get('/api/faculty');
      setFacultyList(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/faculty', formData);
      setFormData({ Name: '', Department: '', RoomNodeID: '', Designation: '' });
      fetchFaculty();
    } catch (error) {
      console.error('Error adding faculty:', error);
    }
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await axios.delete(`/api/faculty/${id}`);
        fetchFaculty();
      } catch (error) {
        console.error('Error deleting faculty:', error);
      }
    }
  };

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Faculty</h2>
      
      {/* Add Form */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New Faculty Member</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Full Name (e.g., Dr. John Doe)" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Department (e.g., MCA)" value={formData.Department} onChange={e => setFormData({...formData, Department: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Designation (e.g., Professor)" value={formData.Designation} onChange={e => setFormData({...formData, Designation: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Room/Office Node ID (e.g., N005)" value={formData.RoomNodeID} onChange={e => setFormData({...formData, RoomNodeID: e.target.value})} required style={inputStyle} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnStyle}>Add Faculty</button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Department</th>
              <th style={thStyle}>Designation</th>
              <th style={thStyle}>Location Node</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center' }}>Loading...</td></tr>
            ) : facultyList.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No faculty members found.</td></tr>
            ) : (
              facultyList.map(faculty => (
                <tr key={faculty._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={tdStyle}><strong>{faculty.Name}</strong></td>
                  <td style={tdStyle}>{faculty.Department}</td>
                  <td style={tdStyle}>{faculty.Designation}</td>
                  <td style={tdStyle}><span style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{faculty.RoomNodeID}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => setDeleteModalId(faculty._id)} style={deleteBtnStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
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
const btnStyle = { backgroundColor: '#e31837', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Poppins', sans-serif" };
const thStyle = { padding: '16px 20px', color: '#5f6368', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 20px', color: '#3c4043', fontSize: '14px', whiteSpace: 'nowrap' };
const deleteBtnStyle = { backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' };

