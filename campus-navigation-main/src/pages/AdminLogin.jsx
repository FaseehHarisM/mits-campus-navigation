import React, { useState } from 'react';
import axios from 'axios';

export default function AdminLogin({ onLogin, setAdminTab }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      onLogin();
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Poppins', sans-serif", maxWidth: '400px', margin: '0 auto', marginTop: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="https://mits.etlab.app/images/logo.png" alt="MITS Logo" style={{ height: '48px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <h1 style={{ color: '#e31837', fontSize: '1.4rem', fontWeight: 800, margin: 0, lineHeight: '1.2' }}>Admin Panel</h1>
        </div>
        <button onClick={() => setAdminTab('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex' }}>
           <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#5f6368' }}>close</span>
        </button>
      </div>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#202124', margin: '0 0 24px 0', fontSize: '24px' }}>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#3c4043', fontWeight: '600', fontSize: '14px' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #dadce0', borderRadius: '8px', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', fontFamily: "'Poppins', sans-serif" }} 
              onFocus={(e) => e.target.style.borderColor = '#e31837'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#3c4043', fontWeight: '600', fontSize: '14px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #dadce0', borderRadius: '8px', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s', fontFamily: "'Poppins', sans-serif" }} 
              onFocus={(e) => e.target.style.borderColor = '#e31837'}
              onBlur={(e) => e.target.style.borderColor = '#dadce0'}
              required 
            />
          </div>
          {error && <div style={{ color: '#e31837', fontSize: '14px', fontWeight: '600' }}>{error}</div>}
          <button type="submit" style={{ background: '#e31837', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', transition: 'background-color 0.2s', fontFamily: "'Poppins', sans-serif" }} onMouseOver={(e) => e.target.style.backgroundColor = '#c8102e'} onMouseOut={(e) => e.target.style.backgroundColor = '#e31837'}>
            Login to Dashboard
          </button>
        </form>
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button 
          onClick={() => setAdminTab('home')} 
          onMouseEnter={(e) => e.currentTarget.style.color = '#e31837'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#5f6368'}
          style={{ background: 'transparent', color: '#5f6368', border: 'none', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontFamily: "'Poppins', sans-serif", transition: 'color 0.2s' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Home Page
        </button>
      </div>
    </div>
  );
}

