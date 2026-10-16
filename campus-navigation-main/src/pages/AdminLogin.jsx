import React, { useState } from 'react';
import axios from 'axios';

export default function AdminLogin({ onLogin, setAdminTab }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/login', { 
        email: cleanEmail, 
        password: cleanPassword 
      });
      localStorage.setItem('adminToken', res.data.token);
      setLoading(false);
      onLogin();
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  const handleAutoFill = () => {
    setEmail('admin@mits.edu');
    setPassword('admin123');
    setError('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: "'Poppins', sans-serif", maxWidth: '420px', margin: '0 auto', marginTop: '60px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="MITS Logo" style={{ height: '46px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          <div>
            <h1 style={{ color: '#e31837', fontSize: '1.3rem', fontWeight: 800, margin: 0, lineHeight: '1.2' }}>MITS Navigation</h1>
            <span style={{ fontSize: '12px', color: '#5f6368', fontWeight: '500' }}>Administrative Portal</span>
          </div>
        </div>
        <button 
          onClick={() => setAdminTab('home')} 
          title="Close and return to Home"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '50%' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#5f6368' }}>close</span>
        </button>
      </div>
      
      {/* Login Card */}
      <div style={{ background: 'white', padding: '32px 28px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #dadce0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span className="material-symbols-outlined" style={{ color: '#e31837', fontSize: '26px' }}>admin_panel_settings</span>
          <h2 style={{ color: '#202124', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Admin Sign In</h2>
        </div>

        {/* Quick Credentials Info Box */}
        <div style={{
          backgroundColor: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: '10px',
          padding: '12px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#5f6368', fontWeight: '600', textTransform: 'uppercase' }}>Default Credentials</div>
            <div style={{ fontSize: '12px', color: '#202124', marginTop: '2px', fontFamily: 'monospace' }}>
              admin@mits.edu / admin123
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            style={{
              padding: '6px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px',
              border: '1px solid #dadce0', background: 'white', color: '#1a73e8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_fix_high</span>
            Auto-fill
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Email Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#3c4043', fontWeight: '600', fontSize: '13px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', color: '#5f6368', fontSize: '20px' }}>mail</span>
              <input 
                type="email" 
                autoComplete="username"
                placeholder="admin@mits.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '12px 14px 12px 40px', border: '1.5px solid #dadce0',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: "'Poppins', sans-serif"
                }} 
                onFocus={(e) => e.target.style.borderColor = '#e31837'}
                onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                required 
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#3c4043', fontWeight: '600', fontSize: '13px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', color: '#5f6368', fontSize: '20px' }}>lock</span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '12px 42px 12px 40px', border: '1.5px solid #dadce0',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  fontFamily: "'Poppins', sans-serif"
                }} 
                onFocus={(e) => e.target.style.borderColor = '#e31837'}
                onBlur={(e) => e.target.style.borderColor = '#dadce0'}
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '10px', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px', color: '#5f6368', display: 'flex'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef3f2', border: '1px solid #fce8e6', borderRadius: '8px',
              padding: '10px 14px', color: '#d93025', fontSize: '13px', fontWeight: '500',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: '#e31837', color: 'white', padding: '14px', border: 'none',
              borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'default' : 'pointer',
              marginTop: '4px', transition: 'background-color 0.2s', fontFamily: "'Poppins', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(227,24,55,0.25)'
            }} 
            onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = '#c8102e'; }} 
            onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = '#e31837'; }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '18px' }}>progress_activity</span>
                Authenticating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>
      </div>

      {/* Return to Home link */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button 
          onClick={() => setAdminTab('home')} 
          onMouseEnter={(e) => e.currentTarget.style.color = '#e31837'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#5f6368'}
          style={{
            background: 'transparent', color: '#5f6368', border: 'none', fontSize: '13px',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontWeight: '500', fontFamily: "'Poppins', sans-serif", transition: 'color 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Campus Navigation
        </button>
      </div>
    </div>
  );
}
