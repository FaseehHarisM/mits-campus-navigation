import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"          \);\n          \)\n        \}\)\}", "          );\n        })}", content)
content = re.sub(r"          \);\r\n          \)\r\n        \}\)\}", "          );\n        })}", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed floating parens")
