-- Rename nenasala_users table to nenasa_users
-- Execute this script in MySQL/XAMPP phpMyAdmin or MySQL command line

USE attendance_db;

-- Rename the table
RENAME TABLE nenasala_users TO nenasa_users;

-- Verify the rename
SHOW TABLES LIKE 'nenasa_users';

-- Check table structure (optional)
DESCRIBE nenasa_users;

SELECT 'Table successfully renamed from nenasala_users to nenasa_users' AS Status;
