import React, { useEffect, useRef, useState } from 'react';
import { getQRNode } from '../services/api';

export default function QRScanner({ setActiveTab, setCurrentLocation, pendingNav, setPendingNav }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    let stream = null;
    let animationFrameId = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access the camera. Please ensure you have granted permissions and are using a secure context (HTTPS/localhost).");
      }
    };

    const tick = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Ensure jsQR is loaded via CDN
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            console.log("Found QR code", code.data);
            const rawData = code.data.trim();
            
            try {
              let qrId = rawData;
              // Handle URL based QR codes
              if (rawData.includes('qr=')) {
                const url = new URL(rawData);
                qrId = url.searchParams.get('qr');
              }

              // Fetch the node from the real backend API
              const node = await getQRNode(qrId);
              
              if (node && node.Name) {
                setScanResult(node.Name);
                setCurrentLocation(node.Name);
                
                if (pendingNav) {
                  setPendingNav(false);
                  setActiveTab('navigate');
                } else {
                  setActiveTab('home');
                }
                return; // Stop processing further frames
              }
            } catch (err) {
              console.error(err);
              setError("Invalid Campus QR Code or Not Found.");
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setActiveTab, setCurrentLocation, pendingNav, setPendingNav]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'black', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Scan Location QR</h2>
        <button onClick={() => setActiveTab('home')} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
            <p>⚠️ {error}</p>
            <button className="btn-primary" onClick={() => setActiveTab('home')}>Go Back</button>
          </div>
        ) : scanResult ? (
           <div className="card" style={{ textAlign: 'center', border: '2px solid #00b894', padding: '20px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#00b894', marginBottom: '12px' }}>check_circle</span>
            <h3 style={{ margin: '0 0 8px 0', color: '#00b894' }}>Location Found!</h3>
            <p style={{ margin: '0 0 16px 0', fontWeight: 'bold', fontSize: '1.2rem' }}>{scanResult}</p>
            <button className="btn-primary" onClick={() => setActiveTab('home')}>Go to Home</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Scanner Overlay Guide */}
            <div style={{ position: 'absolute', width: '250px', height: '250px', border: '4px solid #00ff88', borderRadius: '24px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' }}>
               {/* Animated scanning line could go here */}
            </div>
            <p style={{ position: 'absolute', bottom: '15%', color: 'white', background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: '16px', fontSize: '0.9rem' }}>
              Point camera at a location QR code
            </p>
          </>
        )}
      </div>
    </div>
  );
}
