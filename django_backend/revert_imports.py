import os
import re

backend_dir = r"c:\Users\aswat\OneDrive\Attachments\Documents\Desktop\samples\Extractor\django_backend\apps"

for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Revert `from ..something` to `from apps.something`
            # Revert `from ...something` to `from apps.something`
            new_content = re.sub(r'from\s+\.\.+([a-zA-Z0-9_]+)', r'from apps.\1', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Reverted {filepath}")
