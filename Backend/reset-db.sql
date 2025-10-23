-- Reset root password and create database
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Nemika123#';
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Grant all privileges to root on this database
GRANT ALL PRIVILEGES ON attendance_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;