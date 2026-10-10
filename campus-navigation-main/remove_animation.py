import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("animation: 'fadeIn 0.5s ease-out'", "/* animation removed */")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Animation removed")
