import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';

export default function Home({ setActiveTab, currentLocation, handleNavigation }) {
  const [events, setEvents] = useState([]);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, nodesData] = await Promise.all([
          getEvents(),
          import('../services/api').then(m => m.getNodes())
        ]);
        setEvents(eventsData);
        setNodes(nodesData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const getRoomName = (nodeId) => {
    const node = nodes.find(n => n.NodeID === nodeId);
    return node ? node.Name : nodeId;
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '90px', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'var(--mits-red)', fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, lineHeight: '1.2' }}>
          <img src="https://mits.etlab.app/images/logo.png" alt="MITS Logo" style={{ height: '56px', objectFit: 'contain', mixBlendMode: 'multiply', imageRendering: 'high-quality' }} />
          Campus Navigation
        </h1>
        {currentLocation ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00b894', fontWeight: 600, marginTop: '8px' }}>
            <span className="material-symbols-outlined filled">location_on</span> Current Location: {currentLocation}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Find your way around campus.</p>
        )}
      </header>

      <div className="search-bar" style={{ marginBottom: '24px', padding: '14px 20px' }} onClick={() => setActiveTab('navigate')}>
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search destination..." readOnly style={{ cursor: 'pointer', background: 'transparent', border: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)', fontWeight: 500 }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button className="btn-primary" style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem' }} onClick={() => setActiveTab('scanner')}>
          <span className="material-symbols-outlined">qr_code_scanner</span>
          Scan Location QR
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <button className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setActiveTab('faculty')}>
          <span className="material-symbols-outlined">badge</span>
          Faculty
        </button>
        <button className="btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => setActiveTab('events')}>
          <span className="material-symbols-outlined">calendar_today</span>
          Events
        </button>
      </div>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--mits-red)' }}>local_fire_department</span>
        Ongoing Events
      </h2>
      
      {events.length > 0 ? (
        events.map((evt, idx) => {
          const time = new Date(evt.StartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={idx} className="card" style={{ borderLeft: '4px solid var(--mits-red)', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>{evt.Title}</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>location_on</span> {getRoomName(evt.VenueNodeID)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span> {time}</span>
              </p>
              <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleNavigation(getRoomName(evt.VenueNodeID))}>
                <span className="material-symbols-outlined">directions</span> Navigate
              </button>
            </div>
          );
        })
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No events scheduled for today.</p>
      )}

      {/* Professional Admin Link */}
      <div style={{ marginTop: '64px', textAlign: 'center', borderTop: '1px solid #dadce0', paddingTop: '24px' }}>
        <button 
          onClick={() => setActiveTab('admin')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
          Staff / Admin Login
        </button>
      </div>

    </div>
  );
}
