import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Route Planner UI
content = content.replace("zIndex: 1000", "zIndex: 99999999")

# Fix Floor Switcher UI
content = content.replace("zIndex: 999", "zIndex: 99999999")

# Fix Bottom Tracking UI
content = content.replace("zIndex: 10,", "zIndex: 99999999,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed UI overlapping")
