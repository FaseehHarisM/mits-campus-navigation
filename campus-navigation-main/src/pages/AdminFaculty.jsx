import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminFaculty() {
  const [facultyList, setFacultyList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ Name: '', Department: '', RoomNodeID: '', Designation: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [facRes, nodeRes] = await Promise.all([
        axios.get('/api/faculty'),
        axios.get('/api/nodes')
      ]);
      setFacultyList(facRes.data);
      setNodes(nodeRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/faculty/${editingId}`, formData);
      } else {
        await axios.post(`/api/faculty`, formData);
      }
      setEditingId(null);
      setFormData({ Name: '', Department: '', RoomNodeID: '', Designation: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      Name: item.Name || '',
      Department: item.Department || '',
      RoomNodeID: item.RoomNodeID || '',
      Designation: item.Designation || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ Name: '', Department: '', RoomNodeID: '', Designation: '' });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/faculty/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };

  const getRoomName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    if (!node) return nodeId;
    const floorLabel = node.Floor === '-1' ? 'Ground Floor' : node.Floor === '0' ? '1st Floor' : '2nd Floor';
    return `${node.Name} (${floorLabel})`;
  };

  // Filter available rooms for the dropdown (exclude corridor junctions)
  const roomNodes = nodes.filter(n => n.Type !== 'Junction').sort((a, b) => {
    return (a.Floor || '').localeCompare(b.Floor || '') || a.Name.localeCompare(b.Name);
  });

  const filteredList = facultyList.filter(item => {
    const roomName = getRoomName(item.RoomNodeID);
    return (
      (item.Name && item.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Department && item.Department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Designation && item.Designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.RoomNodeID && item.RoomNodeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Faculty</h2>
      
      {/* Add / Edit Form */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>{editingId ? 'Edit Faculty Member' : 'Add New Faculty Member'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Full Name (e.g., Dr. John Doe)" 
            value={formData.Name} 
            onChange={e => setFormData({...formData, Name: e.target.value})} 
            required 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Department (e.g., Master of Computer Applications)" 
            value={formData.Department} 
            onChange={e => setFormData({...formData, Department: e.target.value})} 
            required 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Designation (e.g., Professor / HOD)" 
            value={formData.Designation} 
            onChange={e => setFormData({...formData, Designation: e.target.value})} 
            required 
            style={inputStyle} 
          />
          
          {/* Room / Office Dropdown with Current Nodes */}
          <select
            value={formData.RoomNodeID}
            onChange={e => setFormData({...formData, RoomNodeID: e.target.value})}
            required
            style={inputStyle}
          >
            <option value="">Select Room / Office Node...</option>
            {roomNodes.map(rm => {
              const floorLabel = rm.Floor === '-1' ? 'G' : rm.Floor === '0' ? 'F1' : 'F2';
              return (
                <option key={rm.NodeID} value={rm.NodeID}>
                  {rm.Name} (Floor {floorLabel}) - [{rm.NodeID}]
                </option>
              );
            })}
          </select>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
              <button type="submit" style={btnStyle}>{editingId ? 'Update Faculty' : 'Add Faculty'}</button>
            </div>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dadce0', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: '#5f6368', marginRight: '8px' }}>search</span>
          <input 
            type="text" 
            placeholder="Search faculty by Name, Dept, Designation, or Office Room..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', width: '100%', color: '#3c4043' }}
          />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Room / Location</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center' }}>Loading faculty directory...</td></tr>
              ) : facultyList.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No faculty members found.</td></tr>
              ) : (
                filteredList.map(faculty => {
                  const node = nodes.find(n => n.NodeID === faculty.RoomNodeID);
                  const floorLabel = node ? (node.Floor === '-1' ? 'Ground' : node.Floor === '0' ? '1st Floor' : '2nd Floor') : '';
                  return (
                    <tr key={faculty._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={tdStyle}><strong>{faculty.Name}</strong></td>
                      <td style={tdStyle}>{faculty.Department}</td>
                      <td style={tdStyle}>{faculty.Designation}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            {node ? `${node.Name} (${floorLabel})` : faculty.RoomNodeID}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(faculty)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                          </button>
                          <button onClick={() => setDeleteModalId(faculty._id)} style={deleteBtnStyle}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No results found matching "{searchTerm}".</td></tr>
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
const btnStyle = { backgroundColor: '#e31837', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: "'Poppins', sans-serif" };
const thStyle = { padding: '16px 20px', color: '#5f6368', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 20px', color: '#3c4043', fontSize: '14px', whiteSpace: 'nowrap' };
const deleteBtnStyle = { backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' };
