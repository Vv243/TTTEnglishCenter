content = open('frontend/app/(main)/page.tsx', encoding='utf-8').read()

# Remove any misplaced AuthUser/authStorage imports anywhere in the file
lines = content.split('\n')
clean_lines = []
for line in lines:
    if 'AuthUser' in line and 'import' in line:
        continue  # remove misplaced import
    if 'authStorage' in line and 'import' in line:
        continue  # remove misplaced import
    clean_lines.append(line)
content = '\n'.join(clean_lines)

# Now add the correct import after line 10 (after statsAPI import)
content = content.replace(
    'import { statsAPI } from "@/lib/api";',
    'import { statsAPI } from "@/lib/api";\nimport { authStorage, AuthUser } from "@/lib/auth";'
)

open('frontend/app/(main)/page.tsx', 'w', encoding='utf-8').write(content)
print('Done')

# Verify first 15 lines
for i, line in enumerate(content.split('\n')[:15], 1):
    print(i, line)