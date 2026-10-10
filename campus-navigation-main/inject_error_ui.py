import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add an error state
content = content.replace(
    "const [nodesData, setNodesData] = useState([]);",
    "const [nodesData, setNodesData] = useState([]);\n    const [fetchError, setFetchError] = useState(null);"
)

# Catch the error
content = content.replace(
    "console.error(\"Error loading graph data\", err);",
    "console.error(\"Error loading graph data\", err);\n          setFetchError(err.message || String(err));"
)

# Display the error on screen
ui_error = """
        {fetchError && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'red', color: 'white', padding: '20px', zIndex: 9999, borderRadius: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            API ERROR: {fetchError}
          </div>
        )}
"""

content = content.replace("<div className=\"navigate-container\">", "<div className=\"navigate-container\">\n" + ui_error)
# Wait, "navigate-container" doesn't exist.
# Replace <div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>
content = content.replace(
    "<div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>",
    "<div style={{ width: '100%', height: '100%', position: 'relative', background: '#E8EAED' }}>\n" + ui_error
)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Error UI")
