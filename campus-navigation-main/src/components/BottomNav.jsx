import React from 'react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      zIndex: 1000,
    }}>
      <NavItem tabId="home" activeTab={activeTab} setActiveTab={setActiveTab} label="Home" icon="home" />
      <NavItem tabId="navigate" activeTab={activeTab} setActiveTab={setActiveTab} label="Navigate" icon="explore" />
      <NavItem tabId="faculty" activeTab={activeTab} setActiveTab={setActiveTab} label="Faculty" icon="groups" />
      <NavItem tabId="events" activeTab={activeTab} setActiveTab={setActiveTab} label="Events" icon="event" />
    </nav>
  );
};

const NavItem = ({ tabId, activeTab, setActiveTab, label, icon }) => {
  const isActive = activeTab === tabId;
  return (
    <div
      onClick={() => setActiveTab(tabId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        color: isActive ? 'var(--mits-red)' : 'var(--text-secondary)',
        gap: '4px',
        flex: 1,
      }}
    >
      <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`} style={{ fontSize: '26px' }}>
        {icon}
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
};

export default BottomNav;
