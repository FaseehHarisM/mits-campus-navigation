import os

filepath = os.path.join('src', 'pages', 'Navigate.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == ")" and lines[i+1].strip() == "})}":
        del lines[i]
        break

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed paren line by line")
