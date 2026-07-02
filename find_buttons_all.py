import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if '<button ' in content:
                    print(f"--- {path} ---")
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if '<button ' in line:
                            print(f"{i+1}: {line.strip()}")
