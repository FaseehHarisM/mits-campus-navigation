import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminFloors() {
  const [floorList, setFloorList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [formData, setFormData] = useState({ FloorID: '', Name: '', BuildingID: 'ramanujan' });
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef(null);

  useEffect(() => { fetchFloors(); }, []);

  const fetchFloors = async () => {
    try {
      const res = await axios.get('/api/floors');
      setFloorList(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.toLowerCase().endsWith('.glb')) {
      alert("Please upload a valid .glb 3D file.");
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('FloorID', formData.FloorID);
    data.append('Name', formData.Name);
    data.append('BuildingID', formData.BuildingID);
    
    const file = fileInputRef.current?.files[0];
    if (file) {
      data.append('MapSVGFile', file); // keeping the same backend variable for compatibility
    }

    await axios.post('/api/floors', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setFormData({ FloorID: '', Name: '', BuildingID: 'ramanujan' });
    if (fileInputRef.current) fileInputRef.current.value = null;
    fetchFloors();
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Delete this Floor?')) {
      await axios.delete(`/api/floors/${id}`);
      fetchFloors();
    }
  };

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Buildings & Floors</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New Floor</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Building ID (e.g., ramanujan)" value={formData.BuildingID} onChange={e => setFormData({...formData, BuildingID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Floor ID (e.g., 0, 1, 2)" value={formData.FloorID} onChange={e => setFormData({...formData, FloorID: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Floor Name (e.g., Ground Floor)" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} required style={inputStyle} />
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#5f6368', fontWeight: 600 }}>Upload 3D Map (.GLB File)</label>
            <input 
              type="file" 
              accept=".glb" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              style={{ padding: '12px', border: '2px dashed #dadce0', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f8f9fa' }} 
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnStyle}>Add Floor & Upload 3D Map</button>
          </div>
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>Floor ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Building</th>
              <th style={thStyle}>3D File (.glb)</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5">Loading...</td></tr> : floorList.map(floor => (
              <tr key={floor._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                <td style={tdStyle}><strong>{floor.FloorID}</strong></td>
                <td style={tdStyle}>{floor.Name}</td>
                <td style={tdStyle}>{floor.BuildingID || 'ramanujan'}</td>
                <td style={tdStyle}>{floor.MapSVG}</td>
                <td style={tdStyle}><button onClick={() => setDeleteModalId(floor._id)} style={deleteBtnStyle}>Delete</button></td>
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
