import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("          );\n        })}", "        })}")
content = content.replace("          )\n        })}", "        })}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed closing parenthesis")
