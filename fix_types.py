with open('frontend/types/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all variants of the duplicate/corrupted line
bad1 = 'status: EnrollmentStatus;\n  waitlist_position?: number | null;`n  waitlist_position?: number | null;'
bad2 = 'status: EnrollmentStatus;\r\n  waitlist_position?: number | null;`n  waitlist_position?: number | null;'
good = 'status: EnrollmentStatus;\n  waitlist_position?: number | null;'

content = content.replace(bad1, good)
content = content.replace(bad2, good)

# Also clean up any remaining literal backtick-n
content = content.replace('`n  waitlist_position?: number | null;', '')

with open('frontend/types/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')

# Verify
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'waitlist' in line or 'EnrollmentStatus' in line:
        print(f"Line {i+1}: {line}")
        