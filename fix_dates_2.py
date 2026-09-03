import os, re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    content = re.sub(r'\{\s*day:\s*[\'"`]numeric[\'"`],\s*month:\s*[\'"`]short[\'"`]\s*\}', r"{ day: '2-digit', month: '2-digit', year: 'numeric' }", content)

    if orig != content:
        print(f"Updated {path}")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
