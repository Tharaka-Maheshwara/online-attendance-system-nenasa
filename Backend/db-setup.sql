-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS attendance_db;

-- Create a new user with proper privileges
CREATE USER IF NOT EXISTS 'nenasa_user'@'localhost' IDENTIFIED BY 'Nemika123#';
GRANT ALL PRIVILEGES ON attendance_db.* TO 'nenasa_user'@'localhost';

-- Reset root password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Nemika123#';

-- Apply changes
FLUSH PRIVILEGES;