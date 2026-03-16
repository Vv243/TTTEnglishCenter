import re

files_to_fix = [
    'frontend/app/(main)/attendance/page.tsx',
    'frontend/app/login/page.tsx',
]

for path in files_to_fix:
    c = open(path, encoding='utf-8').read()
    
    # Add Suspense import if not present
    if 'Suspense' not in c:
        c = c.replace(
            'import { useEffect,',
            'import { useEffect, Suspense,'
        ).replace(
            "import { useState } from 'react'",
            "import { useState, Suspense } from 'react'"
        ).replace(
            'import { useEffect, useState,',
            'import { useEffect, useState, Suspense,'
        )
        # If Suspense still not added, add it to first react import
        if 'Suspense' not in c:
            c = re.sub(
                r"from ['\"]react['\"]",
                lambda m: m.group(0).replace('react', 'react') if 'Suspense' in c else m.group(0),
                c
            )
    
    # Replace useSearchParams with window.location based approach
    # This avoids the Suspense requirement entirely
    c = c.replace(
        'import { useSearchParams } from "next/navigation";\n',
        ''
    ).replace(
        "import { useSearchParams } from 'next/navigation';\n",
        ''
    ).replace(
        'import { useRouter, useSearchParams } from "next/navigation"',
        'import { useRouter } from "next/navigation"'
    ).replace(
        "import { useRouter, useSearchParams } from 'next/navigation'",
        "import { useRouter } from 'next/navigation'"
    )
    
    # Replace useSearchParams() call with a custom hook using URLSearchParams
    c = c.replace(
        'const searchParams = useSearchParams();',
        '''const searchParams = {
    get: (key: string) => {
      if (typeof window === "undefined") return null;
      return new URLSearchParams(window.location.search).get(key);
    }
  };'''
    )
    
    open(path, 'w', encoding='utf-8').write(c)
    print(f'Fixed: {path}')

print('Done')