-- XAMPP MySQL Database Setup Script for Online Attendance System
-- Run this script in phpMyAdmin or MySQL command line after starting XAMPP

-- Create database
CREATE DATABASE IF NOT EXISTS attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE attendance_db;

-- Create user for the application (optional - you can use root)
-- CREATE USER IF NOT EXISTS 'attendance_user'@'localhost' IDENTIFIED BY 'attendance_password';
-- GRANT ALL PRIVILEGES ON attendance_db.* TO 'attendance_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Note: Tables will be created automatically by TypeORM when you start the application
-- The following tables will be created:
-- - nenasala_users (users table)
-- - role (roles table) 
-- - class (classes table)
-- - student (students table)
-- - teacher (teachers table)
-- - course (courses table)
-- - attendance (attendance records)
-- - notifications (email notifications)

-- Verify database creation
SHOW DATABASES;
SHOW TABLES;

-- Optional: Create some initial data after tables are created by TypeORM
-- INSERT INTO role (id, name, permissions) VALUES 
-- (1, 'admin', 'user_management,attendance_management,reports'),
-- (2, 'teacher', 'attendance_marking,student_view'),
-- (3, 'student', 'attendance_view');

SELECT 'Database setup completed successfully!' as status;