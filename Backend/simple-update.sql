-- Simple attendance schema update
USE attendance_db;

-- Create indexes for better performance (ignore if already exist)
CREATE INDEX IF NOT EXISTS idx_attendance_grade ON attendance(grade);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance(subject);
CREATE INDEX IF NOT EXISTS idx_attendance_grade_subject ON attendance(grade, subject);

-- Remove any existing duplicates before adding the constraint
DELETE a1 FROM attendance a1
INNER JOIN attendance a2 
WHERE a1.id > a2.id 
  AND a1.studentId = a2.studentId 
  AND a1.classId = a2.classId 
  AND a1.date = a2.date;

-- Add unique constraint (ignore if already exists)
ALTER TABLE attendance 
ADD CONSTRAINT uk_attendance_student_class_date 
UNIQUE (studentId, classId, date);

-- Show table structure
DESCRIBE attendance;

COMMIT;