with open("backend/tests/test_api.py", "rb") as f:
    raw = f.read()

content = raw.decode("utf-8").replace("\r\n", "\n")

# Remove the conftest import - auth helper should be in conftest or defined here
content = content.replace("from conftest import auth\n\n\n", "")
content = content.replace("from conftest import auth\n\n", "")
content = content.replace("from conftest import auth\n", "")

# Add auth helper directly in the file
old_first_class = '# ── Auth Tests ────────────────────────────────────────────────────────────────'
new_first_class = '''# ── Helper ───────────────────────────────────────────────────────────────────
def auth(token):
    """Helper to create auth headers."""
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ────────────────────────────────────────────────────────────────'''

content = content.replace(old_first_class, new_first_class)

with open("backend/tests/test_api.py", "w", encoding="utf-8", newline="\n") as f:
    f.write(content)
print("test_api.py fixed ✓")