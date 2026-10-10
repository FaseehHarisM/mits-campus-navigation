import os
import re

filepath = os.path.join('src', 'App.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add pendingTransition state
content = content.replace(
    "const [destination, setDestination] = useState('');",
    "const [destination, setDestination] = useState('');\n  const [pendingTransition, setPendingTransition] = useState(null);"
)

# 2. Pass to Navigate
content = re.sub(
    r"<Navigate setActiveTab=\{setActiveTab\} currentLocation=\{currentLocation\} destination=\{destination\} setDestination=\{setDestination\} />",
    r"<Navigate setActiveTab={setActiveTab} currentLocation={currentLocation} destination={destination} setDestination={setDestination} pendingTransition={pendingTransition} setPendingTransition={setPendingTransition} />",
    content
)

# 3. Pass to QRScanner
content = re.sub(
    r"<QRScanner setActiveTab=\{setActiveTab\} setCurrentLocation=\{setCurrentLocation\} pendingNav=\{pendingNav\} setPendingNav=\{setPendingNav\} />",
    r"<QRScanner setActiveTab={setActiveTab} setCurrentLocation={setCurrentLocation} pendingNav={pendingNav} setPendingNav={setPendingNav} pendingTransition={pendingTransition} setPendingTransition={setPendingTransition} />",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx updated with pendingTransition state.")
