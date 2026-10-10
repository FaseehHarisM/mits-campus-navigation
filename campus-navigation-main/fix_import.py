import os

filepath = os.path.join('src', 'pages', 'AdminMapEditor.jsx')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import RealBuildingModel from '../components/RealBuildingModel';", "import { RealBuildingModel } from '../components/RealBuildingModel';")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
