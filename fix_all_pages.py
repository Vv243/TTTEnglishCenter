import os
import glob

# Find all page.tsx files
pages = glob.glob('frontend/app/**/*.tsx', recursive=True)
pages = [p for p in pages if 'page.tsx' in p]

for path in pages:
    path = path.replace('\\', '/')
    try:
        c = open(path, encoding='utf-8').read()
        
        # Skip if already has force-dynamic
        if 'force-dynamic' in c:
            print(f'Already fixed: {path}')
            continue
        
        # Strip all use client lines
        lines = c.split('\n')
        clean = []
        skip_phrases = ['"use client"', "'use client'"]
        for line in lines:
            if any(line.strip() == p or line.strip() == p+';' for p in skip_phrases):
                continue
            clean.append(line)
        
        c = '"use client";\nexport const dynamic = "force-dynamic";\n' + '\n'.join(clean).lstrip('\n')
        open(path, 'w', encoding='utf-8').write(c)
        print(f'Fixed: {path}')
    except Exception as e:
        print(f'Error on {path}: {e}')