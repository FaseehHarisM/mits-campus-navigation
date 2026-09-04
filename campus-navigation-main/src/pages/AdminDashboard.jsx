import React, { useState, useEffect } from 'react';
import AdminFaculty from './AdminFaculty';
import AdminEvents from './AdminEvents';
import AdminNodes from './AdminNodes';
import AdminEdges from './AdminEdges';
import AdminQR from './AdminQR';
import AdminFloors from './AdminFloors';

import axios from 'axios';

const Overview = () => {
  const [stats, setStats] = useState({ floors: 0, nodes: 0, faculty: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [floorsRes, nodesRes, facultyRes, eventsRes] = await Promise.all([
          axios.get('/api/floors'),
          axios.get('/api/nodes'),
          axios.get('/api/faculty'),
          axios.get('/api/events')
        ]);
        
        const uniqueFloors = new Set(nodesRes.data.map(node => node.Floor));
        
        setStats({
          floors: uniqueFloors.size,
          nodes: nodesRes.data.length,
          faculty: facultyRes.data.length,
          events: eventsRes.data.length
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>Dashboard Overview</h2>
      
      {loading ? (
        <div style={{ color: '#5f6368' }}>Loading live statistics...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e31837', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>layers</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#5f6368', fontSize: '14px', fontWeight: 'normal' }}>Total Floors</h3>
              <p style={{ margin: '4px 0 0 0', color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.floors}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e31837', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>share_location</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#5f6368', fontSize: '14px', fontWeight: 'normal' }}>Navigation Nodes</h3>
              <p style={{ margin: '4px 0 0 0', color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.nodes}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e31837', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>groups</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#5f6368', fontSize: '14px', fontWeight: 'normal' }}>Faculty Members</h3>
              <p style={{ margin: '4px 0 0 0', color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.faculty}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#e31837', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>event</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#5f6368', fontSize: '14px', fontWeight: 'normal' }}>Upcoming Events</h3>
              <p style={{ margin: '4px 0 0 0', color: '#3c4043', fontSize: '24px', fontWeight: 'bold' }}>{stats.events}</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

const PlaceholderPage = ({ title }) => (
  <div>
    <h2 style={{ color: '#3c4043', fontWeight: 'bold', fontSize: '24px', marginBottom: '24px' }}>{title}</h2>
    <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #dadce0', textAlign: 'center', color: '#5f6368', marginTop: '20px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', color: '#dadce0' }}>construction</span>
      <h3 style={{ margin: '0 0 8px 0', color: '#3c4043' }}>{title} Management Module</h3>
      <p style={{ margin: 0 }}>This module is currently under construction. CRUD tables will be implemented here.</p>
    </div>
  </div>
);

export default function AdminDashboard({ onLogout, onGoHome }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [hoveredPage, setHoveredPage] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'floors', label: 'Floors', icon: 'layers' },
    { id: 'nodes', label: 'Locations / Nodes', icon: 'share_location' },
    { id: 'edges', label: 'Navigation / Edges', icon: 'route' },
    { id: 'qr', label: 'QR Codes', icon: 'qr_code_scanner' },
    { id: 'faculty', label: 'Faculty', icon: 'groups' },
    { id: 'events', label: 'Events', icon: 'event' },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="admin-layout">
      
      {/* Mobile Top Header (Only visible on mobile) */}
      <div className="admin-mobile-header" style={{ display: 'none', padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #dadce0', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="https://mits.etlab.app/images/logo.png" alt="MITS Logo" style={{ height: '36px', objectFit: 'contain' }} />
          <h1 style={{ color: '#e31837', fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: '1' }}>Admin Panel</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: '#3c4043', padding: '8px', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{isMobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Sidebar - Google Material Style */}
      <div className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header" style={{ padding: '24px', borderBottom: '1px solid #dadce0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="https://mits.etlab.app/images/logo.png" alt="MITS Logo" style={{ height: '48px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <h1 style={{ color: '#e31837', fontSize: '1.3rem', fontWeight: 800, margin: 0, lineHeight: '1.2' }}>Admin Panel</h1>
        </div>
        
        <div className="admin-sidebar-menu">
          {menuItems.map(item => {
            const isActive = activePage === item.id;
            const isHovered = hoveredPage === item.id;
            
            return (
              <div 
                key={item.id}
                className="admin-sidebar-menu-item"
                onClick={() => { setActivePage(item.id); setIsMobileMenuOpen(false); }}
                onMouseEnter={() => setHoveredPage(item.id)}
                onMouseLeave={() => setHoveredPage(null)}
                style={{ 
                  backgroundColor: isActive ? '#fce8eb' : (isHovered ? '#f1f3f4' : 'transparent'),
                  color: isActive ? '#e31837' : '#3c4043',
                  fontWeight: isActive ? '600' : 'normal'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: isActive ? '#e31837' : '#5f6368' }}>{item.icon}</span>
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 0', borderTop: '1px solid #dadce0' }}>
          <div 
            className="admin-sidebar-menu-item"
            onClick={onGoHome}
            style={{ color: '#3c4043' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#5f6368' }}>arrow_back</span>
            <span style={{ fontSize: '14px' }}>Back to Main App</span>
          </div>
          
          <div 
            className="admin-sidebar-menu-item"
            onClick={handleLogout}
            style={{ color: '#3c4043' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#5f6368' }}>logout</span>
            <span style={{ fontSize: '14px' }}>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-content">
        <div className="admin-content-inner">
          {activePage === 'dashboard' && <Overview />}
          {activePage === 'floors' && <AdminFloors />}
          {activePage === 'nodes' && <AdminNodes />}
          {activePage === 'edges' && <AdminEdges />}
          {activePage === 'qr' && <AdminQR />}
          {activePage === 'faculty' && <AdminFaculty />}
          {activePage === 'events' && <AdminEvents />}
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        />
      )}
    </div>
  );
}

