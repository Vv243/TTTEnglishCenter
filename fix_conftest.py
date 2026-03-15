with open("backend/tests/conftest.py", "rb") as f:
    raw = f.read()

content = raw.decode("utf-8").replace("\r\n", "\n")

old = """    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:"""

new = """    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=True,
    ) as ac:"""

if old in content:
    content = content.replace(old, new)
    with open("backend/tests/conftest.py", "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("follow_redirects added ✓")
else:
    print("Pattern not found")
    idx = content.find("AsyncClient")
    print(repr(content[idx:idx+200]))