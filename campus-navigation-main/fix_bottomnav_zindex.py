import os

filepath = os.path.join('src', 'components', 'BottomNav.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("zIndex: 1000,", "zIndex: 9999999999999,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated BottomNav zIndex")
