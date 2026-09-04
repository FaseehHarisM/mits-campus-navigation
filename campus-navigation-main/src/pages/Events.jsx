import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';

export default function Events({ setActiveTab, handleNavigation }) {
  const [events, setEvents] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Ongoing');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, nodesData] = await Promise.all([
          getEvents(),
          import('../services/api').then(m => m.getNodes())
        ]);
        setEvents(eventsData);
        setNodes(nodesData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRoomName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    return node ? node.Name : nodeId;
  };

  const categories = ['Ongoing', 'Today', 'Upcoming'];

  return (
    <div style={{ padding: '24px', paddingBottom: '90px', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--mits-red)', fontSize: '1.8rem' }}>calendar_month</span>
          Campus Events
        </h1>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {categories.map(cat => (
          <span 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '8px 16px', 
              background: activeCategory === cat ? 'var(--mits-red)' : '#e0e0e0', 
              color: activeCategory === cat ? 'white' : 'var(--text-primary)', 
              borderRadius: '24px', 
              fontSize: '0.9rem', 
              fontWeight: activeCategory === cat ? 600 : 500, 
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
            {cat}
          </span>
        ))}
      </div>
      
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {events.filter((evt, idx) => {
            if (activeCategory === 'Ongoing') return idx === 0;
            if (activeCategory === 'Upcoming') return idx > 0;
            return true; // 'Today' shows all
          }).map((evt, originalIdx) => {
            const isOngoing = activeCategory === 'Ongoing' || (activeCategory === 'Today' && originalIdx === 0);
            const time = new Date(evt.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={evt._id || originalIdx} className="card" style={isOngoing ? { borderLeft: '4px solid var(--mits-red)' } : {}}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isOngoing ? 'var(--mits-red)' : '#00b894', marginBottom: '4px' }}>
                  {isOngoing ? 'ONGOING' : 'UPCOMING'}
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>{evt.Title}</h3>
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span> {getRoomName(evt.VenueNodeID)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span> {time}</span>
                </p>
                <button className={isOngoing ? "btn-primary" : "btn-outline"} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleNavigation(getRoomName(evt.VenueNodeID))}>
                  <span className="material-symbols-outlined">directions</span> Navigate
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
