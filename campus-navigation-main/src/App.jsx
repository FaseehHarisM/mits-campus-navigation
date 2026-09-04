import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import Faculty from './pages/Faculty';
import Events from './pages/Events';
import QRScanner from './pages/QRScanner';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pendingNav, setPendingNav] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('adminToken'));

  const handleNavigation = (dest) => {
    setDestination(dest);
    if (!currentLocation) {
      setPendingNav(true);
      setActiveTab('scanner');
    } else {
      setActiveTab('navigate');
    }
  };

  if (activeTab === 'admin') {
    if (isAdminLoggedIn) {
      return <AdminDashboard onLogout={() => { setIsAdminLoggedIn(false); setActiveTab('home'); }} onGoHome={() => setActiveTab('home')} />;
    } else {
      return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} setAdminTab={setActiveTab} />;
    }
  }

  return (
    <div className="app-container">
      <div className="content-area" style={{ paddingBottom: (activeTab === 'navigate' || activeTab === 'scanner') ? '0' : '70px' }}>
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} currentLocation={currentLocation} handleNavigation={handleNavigation} />}
        {activeTab === 'navigate' && <Navigate setActiveTab={setActiveTab} currentLocation={currentLocation} destination={destination} setDestination={setDestination} />}
        {activeTab === 'faculty' && <Faculty setActiveTab={setActiveTab} handleNavigation={handleNavigation} />}
        {activeTab === 'events' && <Events setActiveTab={setActiveTab} handleNavigation={handleNavigation} />}
        {activeTab === 'scanner' && <QRScanner setActiveTab={setActiveTab} setCurrentLocation={setCurrentLocation} pendingNav={pendingNav} setPendingNav={setPendingNav} />}
      </div>
      {activeTab !== 'scanner' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}