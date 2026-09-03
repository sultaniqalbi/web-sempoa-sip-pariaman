import os, re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    # Replace { day: 'numeric', month: 'short', year: 'numeric' }
    content = re.sub(r'\{\s*day:\s*[\'"`]numeric[\'"`],\s*month:\s*[\'"`]short[\'"`],\s*year:\s*[\'"`]numeric[\'"`]\s*\}', r"{ day: '2-digit', month: '2-digit', year: 'numeric' }", content)
    # Replace { day: 'numeric', month: 'long', year: 'numeric' }
    content = re.sub(r'\{\s*day:\s*[\'"`]numeric[\'"`],\s*month:\s*[\'"`]long[\'"`],\s*year:\s*[\'"`]numeric[\'"`]\s*\}', r"{ day: '2-digit', month: '2-digit', year: 'numeric' }", content)
    # Replace { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    content = re.sub(r'\{\s*weekday:\s*[\'"`]long[\'"`],\s*day:\s*[\'"`]numeric[\'"`],\s*month:\s*[\'"`]long[\'"`],\s*year:\s*[\'"`]numeric[\'"`]\s*\}', r"{ day: '2-digit', month: '2-digit', year: 'numeric' }", content)
    # Replace { dateStyle: 'medium', timeStyle: 'short' }
    content = re.sub(r'\{\s*dateStyle:\s*[\'"`]medium[\'"`],\s*timeStyle:\s*[\'"`]short[\'"`]\s*\}', r"{ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }", content)

    if orig != content:
        print(f"Updated {path}")
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
