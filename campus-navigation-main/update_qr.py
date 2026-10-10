import os
import re

filepath = os.path.join('src', 'pages', 'QRScanner.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update signature
content = content.replace(
    "export default function QRScanner({ setActiveTab, setCurrentLocation, pendingNav, setPendingNav }) {",
    "export default function QRScanner({ setActiveTab, setCurrentLocation, pendingNav, setPendingNav, pendingTransition, setPendingTransition }) {"
)

# 2. Inject verification logic
old_logic = r"(if \(node && node\.Name\) \{[\s\S]*?setScanResult\(node\.Name\);[\s\S]*?setCurrentLocation\(node\.Name\);)"
new_logic = r"""\1
                
                if (pendingTransition) {
                  const actualFloorStr = String(node.Floor);
                  const getFloorName = (f) => f === '0' ? '1st Floor' : f === '1' ? '2nd Floor' : 'Ground Floor';
                  
                  if (actualFloorStr === pendingTransition.destFloor) {
                    alert(`✅ You have reached the ${getFloorName(actualFloorStr)}.\nContinuing navigation!`);
                  } else {
                    alert(`⚠️ Wrong Floor Detected!\n\nYou are on the ${getFloorName(actualFloorStr)}, but the expected floor was the ${getFloorName(pendingTransition.destFloor)}.\n\nYour route is being recalculated.`);
                  }
                  setPendingTransition(null);
                  setActiveTab('navigate');
                  return;
                }
"""
content = re.sub(old_logic, new_logic, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("QRScanner updated with Floor Verification.")
