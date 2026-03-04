from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
admin_hash = pwd.hash("admin123")
teacher_hash = pwd.hash("teacher123")

sql = f"""DELETE FROM users;
INSERT INTO users (username, email, hashed_password, role, full_name) VALUES
('admin', 'admin@ttt.edu.vn', '{admin_hash}', 'admin', 'System Admin'),
('co_lan', 'lan@ttt.edu.vn', '{teacher_hash}', 'teacher', 'Co Lan'),
('co_mai', 'mai@ttt.edu.vn', '{teacher_hash}', 'teacher', 'Co Mai'),
('thay_duc', 'duc@ttt.edu.vn', '{teacher_hash}', 'teacher', 'Thay Duc');
"""

with open("seed_users.sql", "w") as f:
    f.write(sql)

print("Done! Contents:")
print(sql)