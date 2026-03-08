-- Update Attendance table to include grade and subject columns
-- Run this SQL script in your MySQL database

USE attendance_db;

-- Add grade and subject columns to attendance table (skip if already exist)
-- Check and add grade column
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_name = 'attendance' AND column_name = 'grade' AND table_schema = 'attendance_db') = 0,
  'ALTER TABLE attendance ADD COLUMN grade INT NULL AFTER classId',
  'SELECT "Grade column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add subject column
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_name = 'attendance' AND column_name = 'subject' AND table_schema = 'attendance_db') = 0,
  'ALTER TABLE attendance ADD COLUMN subject VARCHAR(255) NULL AFTER grade',
  'SELECT "Subject column already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Create unique constraint to prevent duplicate attendance records for same student, class, and date
-- First, remove any existing duplicates before adding the constraint
DELETE a1 FROM attendance a1
INNER JOIN attendance a2 
WHERE a1.id > a2.id 
  AND a1.studentId = a2.studentId 
  AND a1.classId = a2.classId 
  AND a1.date = a2.date;

-- Add unique constraint
ALTER TABLE attendance 
ADD CONSTRAINT uk_attendance_student_class_date 
UNIQUE (studentId, classId, date);

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