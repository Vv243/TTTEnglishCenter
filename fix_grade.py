import re

files = [
    'frontend/components/ui/AddStudentModal.tsx',
    'frontend/components/ui/EditStudentModal.tsx',
]

for path in files:
    try:
        content = open(path, encoding='utf-8').read()
        # Add GradeLevel import if not present
        if 'GradeLevel' not in content:
            content = content.replace(
                'import { studentsAPI } from "@/lib/api";',
                'import { studentsAPI } from "@/lib/api";\nimport type { GradeLevel } from "@/types";'
            )
        # Cast grade_level to GradeLevel
        content = content.replace(
            'grade_level:   form.grade_level,',
            'grade_level:   form.grade_level as GradeLevel,'
        ).replace(
            'grade_level: form.grade_level,',
            'grade_level: form.grade_level as GradeLevel,'
        )
        open(path, 'w', encoding='utf-8').write(content)
        print(f'Fixed {path}')
    except FileNotFoundError:
        print(f'Not found: {path}')