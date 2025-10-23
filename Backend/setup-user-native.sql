-- Drop user if exists to recreate with native password
DROP USER IF EXISTS 'nenasa_user'@'localhost';

-- Create user with native password authentication
CREATE USER 'nenasa_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Nemika123#';

-- Grant privileges
GRANT ALL PRIVILEGES ON attendance_db.* TO 'nenasa_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;