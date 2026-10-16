import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminEvents() {
  const [eventList, setEventList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ Title: '', VenueNodeID: '', StartTime: '', EndTime: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [evtRes, nodeRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/nodes')
      ]);
      setEventList(evtRes.data);
      setNodes(nodeRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/events/${editingId}`, formData);
      } else {
        await axios.post(`/api/events`, formData);
      }
      setEditingId(null);
      setFormData({ Title: '', VenueNodeID: '', StartTime: '', EndTime: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      Title: item.Title || '',
      VenueNodeID: item.VenueNodeID || '',
      StartTime: item.StartTime ? item.StartTime.slice(0, 16) : '',
      EndTime: item.EndTime ? item.EndTime.slice(0, 16) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ Title: '', VenueNodeID: '', StartTime: '', EndTime: '' });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/events/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getVenueName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    if (!node) return nodeId;
    const floorLabel = node.Floor === '-1' ? 'Ground' : node.Floor === '0' ? '1st Floor' : '2nd Floor';
    return `${node.Name} (${floorLabel})`;
  };

  // Filter available venues for the dropdown (exclude junctions)
  const venueNodes = nodes.filter(n => n.Type !== 'Junction').sort((a, b) => {
    return (a.Floor || '').localeCompare(b.Floor || '') || a.Name.localeCompare(b.Name);
  });

  const filteredList = eventList.filter(item => {
    const venueName = getVenueName(item.VenueNodeID);
    return (
      (item.Title && item.Title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.VenueNodeID && item.VenueNodeID.toLowerCase().includes(searchTerm.toLowerCase())) ||
      venueName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Events</h2>
      
      {/* Add / Edit Form */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>{editingId ? 'Edit Event' : 'Add New Event'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Event Title (e.g., MCA Orientation / Hackathon)" 
            value={formData.Title} 
            onChange={e => setFormData({...formData, Title: e.target.value})} 
            required 
            style={inputStyle} 
          />

          {/* Venue Dropdown with Current Nodes */}
          <select
            value={formData.VenueNodeID}
            onChange={e => setFormData({...formData, VenueNodeID: e.target.value})}
            required
            style={inputStyle}
          >
            <option value="">Select Event Venue Node...</option>
            {venueNodes.map(rm => {
              const floorLabel = rm.Floor === '-1' ? 'G' : rm.Floor === '0' ? 'F1' : 'F2';
              return (
                <option key={rm.NodeID} value={rm.NodeID}>
                  {rm.Name} (Floor {floorLabel}) - [{rm.NodeID}]
                </option>
              );
            })}
          </select>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px', fontWeight: 600 }}>Start Time</label>
            <input 
              type="datetime-local" 
              value={formData.StartTime} 
              onChange={e => setFormData({...formData, StartTime: e.target.value})} 
              required 
              style={inputStyle} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px', fontWeight: 600 }}>End Time</label>
            <input 
              type="datetime-local" 
              value={formData.EndTime} 
              onChange={e => setFormData({...formData, EndTime: e.target.value})} 
              required 
              style={inputStyle} 
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #dadce0', background: 'white', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
              <button type="submit" style={btnStyle}>{editingId ? 'Update Event' : 'Add Event'}</button>
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
            placeholder="Search events by Title, Venue, or Date..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', width: '100%', color: '#3c4043' }}
          />
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
                <th style={thStyle}>Event Title</th>
                <th style={thStyle}>Date & Time</th>
                <th style={thStyle}>Venue / Location</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>Loading events...</td></tr>
              ) : eventList.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No events found.</td></tr>
              ) : (
                filteredList.map(event => {
                  const node = nodes.find(n => n.NodeID === event.VenueNodeID);
                  const floorLabel = node ? (node.Floor === '-1' ? 'Ground' : node.Floor === '0' ? '1st Floor' : '2nd Floor') : '';
                  return (
                    <tr key={event._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={tdStyle}><strong>{event.Title}</strong></td>
                      <td style={tdStyle}>
                        <strong>{new Date(event.StartTime).toLocaleDateString()}</strong> {' '}
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>
                          {new Date(event.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(event.EndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                          {node ? `${node.Name} (${floorLabel})` : event.VenueNodeID}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEdit(event)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: 'white', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Edit
                          </button>
                          <button onClick={() => setDeleteModalId(event._id)} style={deleteBtnStyle}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No events found matching "{searchTerm}".</td></tr>
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
