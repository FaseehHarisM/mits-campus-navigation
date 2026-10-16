import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Navigate from './pages/Navigate';
import Faculty from './pages/Faculty';
import Events from './pages/Events';
import QRScanner from './pages/QRScanner';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { getQRNode } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pendingTransition, setPendingTransition] = useState(null);
  const [pendingNav, setPendingNav] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!localStorage.getItem('adminToken'));

  // Automatically detect QR scan from URL on app load (e.g. /scan?qr=QR001 or ?qr=RAM-F1-01)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qrParam = params.get('qr') || params.get('node') || params.get('location');
      const destParam = params.get('dest') || params.get('destination');
      if (destParam) setDestination(destParam);

      // Detect Admin from URL (e.g. /admin, #admin, ?admin, or ?tab=admin)
      if (
        window.location.pathname.toLowerCase().includes('/admin') ||
        window.location.hash.toLowerCase().includes('admin') ||
        params.get('tab') === 'admin' ||
        params.get('admin') !== null
      ) {
        setActiveTab('admin');
      } else if (window.location.pathname.includes('/scan') && !qrParam) {
        setActiveTab('scanner');
      }

      if (qrParam) {
        getQRNode(qrParam)
          .then(node => {
            if (node && node.Name) {
              setCurrentLocation(node.Name);
              if (destParam) {
                setActiveTab('navigate');
              } else {
                setActiveTab('home');
              }
            }
          })
          .catch(err => {
            console.error("URL QR parse error", err);
          });
      }
    } catch (e) {
      console.warn("Failed to parse URL query params", e);
    }
  }, []);

  const handleNavigation = (dest) => {
    setDestination(dest);
    if (!currentLocation) {
      setPendingNav(true);
      setActiveTab('scanner');
    } else {
      setActiveTab('navigate');
    }
  };

  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTop = 0;
  }, [activeTab]);

  if (activeTab === 'admin') {
    if (isAdminLoggedIn) {
      return <AdminDashboard onLogout={() => { setIsAdminLoggedIn(false); setActiveTab('home'); }} onGoHome={() => setActiveTab('home')} />;
    } else {
      return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} setAdminTab={setActiveTab} />;
    }
  }

  return (
    <div className="app-container">
      <div 
        className="content-area" 
        style={{ 
          paddingBottom: '0',
          overflow: (activeTab === 'navigate' || activeTab === 'scanner') ? 'hidden' : 'auto',
          height: 'calc(100% - 64px)',
          position: 'relative'
        }}
      >
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} currentLocation={currentLocation} handleNavigation={handleNavigation} />}
        {activeTab === 'navigate' && <Navigate setActiveTab={setActiveTab} currentLocation={currentLocation} destination={destination} setDestination={setDestination} pendingTransition={pendingTransition} setPendingTransition={setPendingTransition} />}
        {activeTab === 'faculty' && <Faculty setActiveTab={setActiveTab} handleNavigation={handleNavigation} />}
        {activeTab === 'events' && <Events setActiveTab={setActiveTab} handleNavigation={handleNavigation} />}
        {activeTab === 'scanner' && <QRScanner setActiveTab={setActiveTab} setCurrentLocation={setCurrentLocation} pendingNav={pendingNav} setPendingNav={setPendingNav} pendingTransition={pendingTransition} setPendingTransition={setPendingTransition} />}
      </div>
      {activeTab !== 'scanner' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}