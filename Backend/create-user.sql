CREATE USER IF NOT EXISTS 'nenasa_user'@'localhost' IDENTIFIED BY 'Nemika123#';
GRANT ALL PRIVILEGES ON attendance_db.* TO 'nenasa_user'@'localhost';
FLUSH PRIVILEGES;
