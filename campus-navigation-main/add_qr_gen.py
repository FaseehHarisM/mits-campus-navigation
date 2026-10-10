import os
import re

filepath = os.path.join('src', 'pages', 'AdminQR.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'QRCodeCanvas' not in content:
    content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport { QRCodeCanvas } from 'qrcode.react';")

# 2. Add state
if 'generateQrData' not in content:
    state_injection = """  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generateQrData, setGenerateQrData] = useState(null);"""
    content = content.replace("  const [loading, setLoading] = useState(true);\n  const [searchTerm, setSearchTerm] = useState('');", state_injection)

# 3. Add modal logic at the bottom before </div>);
modal_code = """
      {generateQrData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#3c4043' }}>QR Code</h3>
              <button onClick={() => setGenerateQrData(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#5f6368' }}>close</span>
              </button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px' }}>
              <QRCodeCanvas 
                id="qr-canvas"
                value={`${window.location.origin}/scan?qr=${generateQrData.QRID}`} 
                size={220} 
                level={"H"}
              />
            </div>
            
            <div style={{ textAlign: 'left', background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f6368' }}><strong>QR ID:</strong> {generateQrData.QRID}</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f6368' }}><strong>Node ID:</strong> {generateQrData.NodeID}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#1a73e8', wordBreak: 'break-all' }}>{`${window.location.origin}/scan?qr=${generateQrData.QRID}`}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  const canvas = document.getElementById('qr-canvas');
                  const url = canvas.toDataURL("image/png");
                  const link = document.createElement('a');
                  link.download = `QR_${generateQrData.QRID}.png`;
                  link.href = url;
                  link.click();
                }}
                style={{ flex: 1, padding: '12px', background: '#e31837', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Download
              </button>
              
              <button 
                onClick={() => {
                  const canvas = document.getElementById('qr-canvas');
                  const url = canvas.toDataURL("image/png");
                  const win = window.open('');
                  win.document.write(`<html><head><title>Print QR</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><img src="${url}" style="width:300px;height:300px;margin-bottom:20px;"/><h1 style="font-family:sans-serif;margin:0;">Location: ${generateQrData.NodeID}</h1><p style="font-family:sans-serif;color:#666;">QR ID: ${generateQrData.QRID}</p><script>window.onload = function() { window.print(); window.close(); }</script></body></html>`);
                  win.document.close();
                }}
                style={{ flex: 1, padding: '12px', background: 'white', color: '#3c4043', border: '1px solid #dadce0', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span> Print
              </button>
            </div>
          </div>
        </div>
      )}
"""
if 'qr-canvas' not in content:
    content = content.replace("</div>\n  );\n}\n\nconst inputStyle", modal_code + "</div>\n  );\n}\n\nconst inputStyle")

# 4. Inject "Generate QR" button into the table
if 'setGenerateQrData(qr)' not in content:
    btn_injection = """<button onClick={() => setGenerateQrData(qr)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #dadce0', background: '#f8f9fa', color: '#3c4043', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_2</span> Generate
                          </button>
                          <button onClick={() => handleEdit(qr)}"""
    content = content.replace("<button onClick={() => handleEdit(qr)}", btn_injection)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminQR.jsx patched with QR Generator")
