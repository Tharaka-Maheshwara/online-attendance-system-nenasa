-- Create user if not exists
CREATE USER IF NOT EXISTS 'nenasa_user'@'localhost' IDENTIFIED BY 'Nemika123#';

-- Grant privileges
GRANT ALL PRIVILEGES ON attendance_db.* TO 'nenasa_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;