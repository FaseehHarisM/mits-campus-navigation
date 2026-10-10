import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = r"(if \(n1\.Floor !== n2\.Floor\) \{[\s\S]*?\} else \{)\s*walkingDistance \+= Math\.hypot\(p2\.x - p1\.x, p2\.z - p1\.z\);\s*\}"

new_logic = r"""\1
            const isFirstSegmentRoom = (i === 0 && n1.Type !== 'Junction' && n1.Type !== 'Stairs' && n1.Type !== 'Elevator');
            const isLastSegmentRoom = (i === points.length - 2 && n2.Type !== 'Junction' && n2.Type !== 'Stairs' && n2.Type !== 'Elevator');
            
            if (!isFirstSegmentRoom && !isLastSegmentRoom) {
              walkingDistance += Math.hypot(p2.x - p1.x, p2.z - p1.z);
            }
          }"""

content = re.sub(old_logic, new_logic, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Implemented intelligent doorway distance calculation")
