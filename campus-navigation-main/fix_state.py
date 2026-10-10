import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const [routeError, setRouteError] = useState(null);",
    "const [routeError, setRouteError] = useState(null);\n  const [is3D, setIs3D] = useState(true);"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed missing state")
