import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add routeError state
content = re.sub(r"const \[activeRoute, setActiveRoute\] = useState\(null\);", "const [activeRoute, setActiveRoute] = useState(null);\n    const [routeError, setRouteError] = useState(null);", content)

# 2. Modify calculateRoute to set error instead of alert
old_calc = """        setLivePosition(points[0].clone());
        resetSteps();
      } else {
        alert("No route found. Try disabling accessibility mode if you must use stairs.");
      }"""

new_calc = """        setLivePosition(points[0].clone());
        resetSteps();
        setRouteError(null);
      } else {
        setActiveRoute(null);
        setRouteError("No route found. The path may be disconnected.");
      }"""
content = content.replace(old_calc, new_calc)

# Clear error when starting
content = content.replace("  const calculateRoute = React.useCallback(() => {", "  const calculateRoute = React.useCallback(() => {\n      setRouteError(null);")

# 3. Display error in UI instead of "Route not started"
old_ui = """               <span style={{ fontWeight: 600, color: activeRoute ? '#34a853' : '#5f6368' }}>
                 {getDistanceDisplay()}
               </span>"""
new_ui = """               <span style={{ fontWeight: 600, color: routeError ? '#EA4335' : (activeRoute ? '#34a853' : '#5f6368') }}>
                 {routeError ? routeError : getDistanceDisplay()}
               </span>"""
content = content.replace(old_ui, new_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed alert and added UI error message")
