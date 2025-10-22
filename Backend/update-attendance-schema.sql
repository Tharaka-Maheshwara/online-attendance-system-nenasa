-- Update Attendance table to include grade and subject columns
-- Run this SQL script in your MySQL database

USE attendance_db;

-- Add grade and subject columns to attendance table
ALTER TABLE attendance 
ADD COLUMN grade INT NULL AFTER classId,
ADD COLUMN subject VARCHAR(255) NULL AFTER grade;

-- Update existing records with grade and subject information from class table
UPDATE attendance a
INNER JOIN class c ON a.classId = c.id
SET 
    a.grade = c.grade,
    a.subject = c.subject;1`

-- Create index for better performance on grade-based queries
CREATE INDEX idx_attendance_grade ON attendance(grade);
CREATE INDEX idx_attendance_subject ON attendance(subject);
CREATE INDEX idx_attendance_grade_subject ON attendance(grade, subject);

-- Show updated table structure
DESCRIBE attendance;

-- Verify the update worked
SELECT 
    a.id,
    a.studentId,
    a.classId,
    a.grade,
    a.subject,
    a.date,
    a.status,
    c.subject as class_subject,
    c.grade as class_grade
FROM attendance a
LEFT JOIN class c ON a.classId = c.id
LIMIT 10;

COMMIT;