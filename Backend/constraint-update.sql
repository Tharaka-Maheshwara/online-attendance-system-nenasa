-- MySQL 5.7 compatible attendance schema update
USE attendance_db;

-- Remove duplicates first
DELETE a1 FROM attendance a1
INNER JOIN attendance a2 
WHERE a1.id > a2.id 
  AND a1.studentId = a2.studentId 
  AND a1.classId = a2.classId 
  AND a1.date = a2.date;

-- Add unique constraint to prevent duplicates
ALTER TABLE attendance 
ADD CONSTRAINT uk_attendance_student_class_date 
UNIQUE (studentId, classId, date);

-- Show table structure
DESCRIBE attendance;