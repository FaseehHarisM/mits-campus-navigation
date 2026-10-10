import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("          return (\n            return (", "          return (")
content = content.replace("          return (\n          return (", "          return (")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed return")
