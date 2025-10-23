-- Drop user if exists to recreate
DROP USER IF EXISTS 'nenasa_user'@'localhost';

-- Create user (MariaDB syntax)
CREATE USER 'nenasa_user'@'localhost' IDENTIFIED BY 'Nemika123#';

-- Grant privileges
GRANT ALL PRIVILEGES ON attendance_db.* TO 'nenasa_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;