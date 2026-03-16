files = [
    'frontend/app/(main)/attendance/page.tsx',
    'frontend/app/login/page.tsx',
]

for path in files:
    content = open(path, encoding='utf-8').read()
    if 'force-dynamic' not in content:
        # Remove "use client" from start, then re-add with dynamic export
        content = content.replace('"use client";\n', '').replace('"use client";\r\n', '')
        content = '"use client";\nexport const dynamic = "force-dynamic";\n' + content
        open(path, 'w', encoding='utf-8').write(content)
        print(f'Fixed {path}')
    else:
        print(f'Already has it: {path}')