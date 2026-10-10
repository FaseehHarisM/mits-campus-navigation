import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a state for isMobile
is_mobile_hook = """  const [activeRoute, setActiveRoute] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);"""

content = content.replace('  const [activeRoute, setActiveRoute] = useState(null);', is_mobile_hook)

# Update OrbitControls
content = content.replace('maxDistance={30000}', 'maxDistance={isMobile ? 3000 : 30000}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Navigate.jsx patched with mobile zoom limit.")
