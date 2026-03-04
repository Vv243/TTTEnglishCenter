DELETE FROM users;
INSERT INTO users (username, email, hashed_password, role, full_name) VALUES
('admin', 'admin@ttt.edu.vn', '$2b$12$Z/yTv6yrWsOp9MuF42eal.X/yVoEf43Gu8..cnMCfEmNcfEX1eOGW', 'admin', 'System Admin'),
('co_lan', 'lan@ttt.edu.vn', '$2b$12$If2XEU2lF/b/ni4ozfPIFOZJtbJhd5goywFVTaA6sK9ke3N0DIp1a', 'teacher', 'Co Lan'),
('co_mai', 'mai@ttt.edu.vn', '$2b$12$If2XEU2lF/b/ni4ozfPIFOZJtbJhd5goywFVTaA6sK9ke3N0DIp1a', 'teacher', 'Co Mai'),
('thay_duc', 'duc@ttt.edu.vn', '$2b$12$If2XEU2lF/b/ni4ozfPIFOZJtbJhd5goywFVTaA6sK9ke3N0DIp1a', 'teacher', 'Thay Duc');
