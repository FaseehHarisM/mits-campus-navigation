import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add props to Navigate
old_signature = r"export default function Navigate\(\{ setActiveTab, currentLocation, destination, setDestination \}\) \{"
new_signature = "export default function Navigate({ setActiveTab, currentLocation, destination, setDestination, pendingTransition, setPendingTransition }) {"
content = re.sub(old_signature, new_signature, content)

# 2. Add transition intercept logic to the usePDR useEffect
old_loop = r"(for \(let i = 0; i < points\.length - 1; i\+\+\) \{[\s\S]*?const n2 = pathNodes\[i \+ 1\];[\s\S]*?let segmentLogicalDist = Math\.hypot\(p2\.x - p1\.x, p2\.z - p1\.z\);) "
new_loop = r"""\1 
      let isTransition = false;
      let transType = '';

      if (n1.Floor !== n2.Floor) {
        if (n1.Type === 'Elevator' && n2.Type === 'Elevator') {
          segmentLogicalDist = 0; 
          isTransition = true;
          transType = 'Lift';
        } else if (n1.Type === 'Stairs' && n2.Type === 'Stairs') {
          segmentLogicalDist = 75; 
          isTransition = true;
          transType = 'Staircase';
        }
      }

      if (isTransition && distanceToTravel > 0) {
        setPendingTransition({
          type: transType,
          currentFloor: String(n1.Floor),
          destFloor: String(n2.Floor),
          nodeName: n1.Name
        });
        stopTracking();
        newPos = p1.clone();
        distanceToTravel = 0;
        break;
      }
"""
content = re.sub(old_loop, new_loop, content)

# 3. Add the UI Overlay
overlay_ui = """
      {pendingTransition && (
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 99999999999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
             <div style={{ width: '64px', height: '64px', background: '#e8f0fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#4285F4' }}>
                 {pendingTransition.type === 'Lift' ? 'elevator' : 'stairs'}
               </span>
             </div>
             <h2 style={{ color: '#4285F4', margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 800 }}>{pendingTransition.type.toUpperCase()} NAVIGATION</h2>
             
             <div style={{ textAlign: 'left', margin: '20px 0', background: '#f8f9fa', padding: '20px', borderRadius: '16px', border: '1px solid #e8eaed' }}>
               <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                 <strong style={{ color: '#3c4043' }}>Current Floor:</strong> 
                 <span style={{ color: '#1a73e8', fontWeight: 600 }}>{pendingTransition.currentFloor === '0' ? '1st Floor' : pendingTransition.currentFloor === '1' ? '2nd Floor' : 'Ground Floor'}</span>
               </p>
               <div style={{ height: '1px', background: '#e8eaed', width: '100%', marginBottom: '12px' }}></div>
               <p style={{ margin: 0, fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                 <strong style={{ color: '#3c4043' }}>Destination:</strong> 
                 <span style={{ color: '#34a853', fontWeight: 600 }}>{pendingTransition.destFloor === '0' ? '1st Floor' : pendingTransition.destFloor === '1' ? '2nd Floor' : 'Ground Floor'}</span>
               </p>
             </div>
             
             <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#202124', lineHeight: 1.5, marginBottom: '16px' }}>
               {pendingTransition.type === 'Lift' 
                 ? `Enter ${pendingTransition.nodeName} and select the destination floor.`
                 : `Take ${pendingTransition.nodeName} to the destination floor.`}
             </p>
             
             <p style={{ fontSize: '1rem', color: '#5f6368', marginBottom: '32px', lineHeight: 1.5 }}>
               After reaching the {pendingTransition.type === 'Lift' ? 'lift lobby' : 'landing'}, scan the QR code to verify your location and continue.
             </p>
             
             <button onClick={() => { setActiveTab('scanner'); }} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.2rem', borderRadius: '30px', background: '#4285F4', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
               <span className="material-symbols-outlined">qr_code_scanner</span> Scan QR Code
             </button>
          </div>
        </div>
      )}
"""
content = re.sub(r"(<div style=\{\{ width: '100%', height: '100%' \}\}>)", overlay_ui + r"\n        \1", content)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Navigate.jsx updated with Staircase logic.")
