import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the handleEmergency function inside Navigate()
# Look for: const [isAccessible, setIsAccessible] = useState(false);
emergency_func = """
  const handleEmergency = () => {
    if (!currentLocation) {
      alert("Please scan your current location first!");
      return;
    }
    const startNode = nodesData.find(n => n.Name === currentLocation);
    if (!startNode) return;

    // Define exits
    const exits = nodesData.filter(n => 
      n.Type === 'Exit' || 
      (n.Name && (n.Name.toLowerCase().includes('exit') || n.Name.toLowerCase().includes('main door')))
    );

    if (exits.length === 0) {
      alert("No emergency exits found in the database. Please name a node 'Exit' or 'Main Door'.");
      return;
    }

    let nearestExit = null;
    let minDistance = Infinity;

    exits.forEach(exit => {
      const result = runDijkstra(startNode.NodeID, exit.NodeID, nodesData, graphData, false);
      if (result && result.totalDistance < minDistance) {
        minDistance = result.totalDistance;
        nearestExit = exit;
      }
    });

    if (nearestExit) {
      setDestination(nearestExit.Name);
    } else {
      alert("No valid route to an emergency exit found!");
    }
  };
"""

content = content.replace(
    "const [isAccessible, setIsAccessible] = useState(false);",
    "const [isAccessible, setIsAccessible] = useState(false);\n" + emergency_func
)

# 2. Add the UI button
old_ui = """<h2 style={{ fontSize: '1.2rem', margin: 0, color: '#3c4043' }}>Route Planner</h2>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1967d2', background: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>"""
              
new_ui = """<h2 style={{ fontSize: '1.2rem', margin: 0, color: '#3c4043' }}>Route Planner</h2>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={handleEmergency} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'white', background: '#d93025', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>directions_run</span>
                  Emergency
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1967d2', background: '#e8f0fe', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer' }}>"""

content = content.replace(old_ui, new_ui)

# 3. Close the new div wrapper for the buttons
old_close = """<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span>
                Avoid Stairs
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>"""

new_close = """<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>accessible</span>
                  Avoid Stairs
                </label>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>"""

content = content.replace(old_close, new_close)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Emergency Exit button integrated.")
