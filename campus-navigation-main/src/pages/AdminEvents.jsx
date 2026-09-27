import React, { useState, useEffect } from 'react';
import DeleteModal from '../components/DeleteModal';
import axios from 'axios';

export default function AdminEvents() {
  const [eventList, setEventList] = useState([]);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [formData, setFormData] = useState({ Title: '', VenueNodeID: '', StartTime: '', EndTime: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      setEventList(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/events', formData);
      setFormData({ Title: '', VenueNodeID: '', StartTime: '', EndTime: '' });
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleDelete = async (id) => {
    if (true || window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`/api/events/${id}`);
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Manage Events</h2>
      
      {/* Add Form */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#3c4043', fontSize: '16px' }}>Add New Event</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <input type="text" placeholder="Event Title (e.g., MCA Orientation)" value={formData.Title} onChange={e => setFormData({...formData, Title: e.target.value})} required style={inputStyle} />
          <input type="text" placeholder="Venue Node ID (e.g., N012)" value={formData.VenueNodeID} onChange={e => setFormData({...formData, VenueNodeID: e.target.value})} required style={inputStyle} />
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>Start Time</label>
            <input type="datetime-local" value={formData.StartTime} onChange={e => setFormData({...formData, StartTime: e.target.value})} required style={inputStyle} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '12px', color: '#5f6368', marginBottom: '4px' }}>End Time</label>
            <input type="datetime-local" value={formData.EndTime} onChange={e => setFormData({...formData, EndTime: e.target.value})} required style={inputStyle} />
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={btnStyle}>Add Event</button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #dadce0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dadce0' }}>
              <th style={thStyle}>Event Title</th>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Venue Node</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>Loading...</td></tr>
            ) : eventList.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#5f6368' }}>No events found.</td></tr>
            ) : (
              eventList.map(event => (
                <tr key={event._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={tdStyle}><strong>{event.Title}</strong></td>
                  <td style={tdStyle}>
                    {new Date(event.StartTime).toLocaleString()} <br/>
                    <span style={{ fontSize: '12px', color: '#5f6368' }}>to {new Date(event.EndTime).toLocaleString()}</span>
                  </td>
                  <td style={tdStyle}><span style={{ backgroundColor: '#e6f4ea', color: '#1e8e3e', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{event.VenueNodeID}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => setDeleteModalId(event._id)} style={deleteBtnStyle}>
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

