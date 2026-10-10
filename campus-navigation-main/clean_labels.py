import os
import re

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the text box div and remove it entirely.
old_div_regex = r"<div style=\{\{\s*position:\s*'absolute',\s*top:\s*'32px'[\s\S]*?</div>"

content = re.sub(old_div_regex, "", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed text labels from map pins")
