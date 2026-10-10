import os

filepath = os.path.join('src', 'pages', 'QRScanner.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("border: '4px solid #00ff88'", "border: '4px solid #EA4335'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Changed scanner frame to red")
