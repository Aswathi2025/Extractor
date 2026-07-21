import os
import re

backend_dir = r"c:\Users\aswat\OneDrive\Attachments\Documents\Desktop\samples\Extractor\django_backend\apps"

for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # For views.py and models.py directly inside apps/<app_name>/
            # The depth from apps/ is 1. So '..' goes to apps/
            rel_path = os.path.relpath(filepath, backend_dir)
            parts = rel_path.split(os.sep)
            
            # Calculate how many dots we need to go back to the `apps` directory
            # For apps/users/views.py -> parts = ['users', 'views.py'] -> len=2 -> depth=1
            # For apps/authentication/management/commands/seed_admin.py -> parts = ['authentication', 'management', 'commands', 'seed_admin.py'] -> len=4 -> depth=3
            
            depth = len(parts) - 1
            dots = "." * (depth + 1)
            
            new_content = re.sub(r'from\s+apps\.', f'from {dots}', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
