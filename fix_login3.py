path = 'frontend/app/login/page.tsx'
c = open(path, encoding='utf-8').read()

# Replace useSearchParams() usage with window.location version
old = "  const searchParams = useSearchParams()\n"
new = """  const searchParams = {
    get: (key: string) => {
      if (typeof window === "undefined") return null;
      return new URLSearchParams(window.location.search).get(key);
    }
  };\n"""

c = c.replace(old, new)

open(path, 'w', encoding='utf-8').write(c)
print('Done')
print(c[200:500])