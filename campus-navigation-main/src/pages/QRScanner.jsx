import React, { useEffect, useRef, useState } from 'react';
import { getQRNode, getNodes } from '../services/api';

export default function QRScanner({ setActiveTab, setCurrentLocation, pendingNav, setPendingNav, pendingTransition, setPendingTransition }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [nodesList, setNodesList] = useState([]);
  const [selectedManualNode, setSelectedManualNode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch nodes list for manual selection fallback
  useEffect(() => {
    getNodes()
      .then(nodes => {
        const rooms = nodes.filter(n => n.Type !== 'Junction');
        rooms.sort((a, b) => a.Name.localeCompare(b.Name));
        setNodesList(rooms);
      })
      .catch(err => console.error("Could not fetch nodes for manual selector", err));
  }, []);

  // Robust QR data parser
  const parseQRData = (rawData) => {
    if (!rawData) return '';
    let str = String(rawData).trim();

    // Check JSON
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const obj = JSON.parse(str);
        if (obj.qr || obj.qrId || obj.NodeID || obj.nodeId || obj.id) {
          return obj.qr || obj.qrId || obj.NodeID || obj.nodeId || obj.id;
        }
      } catch (e) {}
    }

    // Check for query parameters ?qr=... or ?node=... or &qr=...
    const qrMatch = str.match(/[?&]qr=([^&#]+)/);
    if (qrMatch) return decodeURIComponent(qrMatch[1]);

    const nodeMatch = str.match(/[?&]node=([^&#]+)/);
    if (nodeMatch) return decodeURIComponent(nodeMatch[1]);

    // Check for path like /scan/QR001
    if (str.includes('/scan/')) {
      const parts = str.split('/scan/');
      if (parts[1]) return decodeURIComponent(parts[1].split(/[?#]/)[0]);
    }

    return str;
  };

  const handleLocationResolved = (node) => {
    if (!node || !node.Name) return;
    setScanResult(node.Name);
    setCurrentLocation(node.Name);

    if (pendingTransition) {
      const actualFloorStr = String(node.Floor);
      const getFloorName = (f) => f === '0' ? '1st Floor' : f === '1' ? '2nd Floor' : 'Ground Floor';

      if (actualFloorStr === pendingTransition.destFloor) {
        alert(`✅ Reached ${getFloorName(actualFloorStr)}.\nContinuing navigation!`);
      } else {
        alert(`⚠️ Wrong Floor Detected!\n\nYou are on ${getFloorName(actualFloorStr)}, but expected ${getFloorName(pendingTransition.destFloor)}.\nRoute will recalculate.`);
      }
      setPendingTransition(null);
      setActiveTab('navigate');
      return;
    }

    if (pendingNav) {
      setPendingNav(false);
      setActiveTab('navigate');
    } else {
      setActiveTab('home');
    }
  };

  const processQRCode = async (rawCode) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const parsedId = parseQRData(rawCode);

    try {
      const node = await getQRNode(parsedId);
      if (node && node.Name) {
        handleLocationResolved(node);
      } else {
        setError(`QR Code "${parsedId}" found, but no matching campus location.`);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("QR lookup error:", err);
      setError(`QR Code not recognized (${parsedId}). Try selecting manually below.`);
      setIsProcessing(false);
    }
  };

  // Image Upload Scanner Fallback
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            processQRCode(code.data);
          } else {
            setError("No QR code detected in the selected image. Please try another photo.");
          }
        } else {
          setError("QR decoder library is loading. Please try again.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Live Camera Scanner
  useEffect(() => {
    let stream = null;
    let animationFrameId = null;
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera access is not available (browser requires HTTPS on mobile). Please use 'Upload QR Photo' or choose your location below.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          await videoRef.current.play();
          animationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.warn("Camera start error:", err);
        setError("Camera permission denied or unavailable. You can upload a QR image or select your room below.");
      }
    };

    const tick = () => {
      if (!isMounted) return;

      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas) {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          if (window.jsQR) {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              processQRCode(code.data);
              return; // Stop animation loop once found
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#121212', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', color: 'white', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#4285F4' }}>qr_code_scanner</span>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Scan Location QR</h2>
        </div>
        <button onClick={() => setActiveTab('home')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>✕</button>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {scanResult ? (
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', textAlign: 'center', margin: '20px', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', color: '#1e8e3e', marginBottom: '12px' }}>check_circle</span>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e8e3e', fontSize: '1.4rem' }}>Location Found!</h3>
            <p style={{ margin: '0 0 20px 0', fontWeight: 'bold', fontSize: '1.2rem', color: '#202124' }}>{scanResult}</p>
            <button className="btn-primary" style={{ padding: '12px 24px', borderRadius: '24px', width: '100%' }} onClick={() => setActiveTab('navigate')}>
              Start Navigating
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Target Reticle */}
            <div style={{ position: 'absolute', width: '240px', height: '240px', border: '3px solid #4285F4', borderRadius: '24px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.55)', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderTop: '5px solid #4285F4', borderLeft: '5px solid #4285F4', borderRadius: '18px 0 0 0' }}></div>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '24px', height: '24px', borderTop: '5px solid #4285F4', borderRight: '5px solid #4285F4', borderRadius: '0 18px 0 0' }}></div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '24px', borderBottom: '5px solid #4285F4', borderLeft: '5px solid #4285F4', borderRadius: '0 0 0 18px' }}></div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderBottom: '5px solid #4285F4', borderRight: '5px solid #4285F4', borderRadius: '0 0 18px 0' }}></div>
            </div>

            {error && (
              <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', background: 'rgba(234, 67, 53, 0.95)', color: 'white', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center', zIndex: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls / Fallbacks */}
      {!scanResult && (
        <div style={{ background: '#202124', padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
          {/* File Picker Button */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
            Upload / Take Photo of QR
          </button>

          {/* Manual Room Selection Fallback */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedManualNode}
              onChange={(e) => setSelectedManualNode(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#303134',
                color: 'white',
                border: '1px solid #5f6368',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>Or choose your room manually...</option>
              {nodesList.map(node => (
                <option key={node.NodeID} value={node.NodeID}>
                  {node.Name} ({node.Floor === '0' ? '1st Floor' : node.Floor === '1' ? '2nd Floor' : 'Ground'})
                </option>
              ))}
            </select>

            <button
              disabled={!selectedManualNode}
              onClick={() => {
                const node = nodesList.find(n => n.NodeID === selectedManualNode);
                if (node) handleLocationResolved(node);
              }}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: 'none',
                background: selectedManualNode ? '#4285F4' : '#5f6368',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: selectedManualNode ? 'pointer' : 'not-allowed'
              }}
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
