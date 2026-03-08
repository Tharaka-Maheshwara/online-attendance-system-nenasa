-- SQL Script to Add Parent Email Addresses to Existing Students
-- This script adds parent emails to the existing students for testing email notifications

-- Update existing students with parent email addresses
-- Based on the database screenshot showing students with IDs 17, 18, 19

-- Update Nenasala User 1 (ID: 17)
UPDATE nenasa_users 
SET 
    parentEmail = 'parent1@nenasala.lk',
    parentName = 'Parent of Nenasala User 1'
WHERE id = 17;

-- Update Nenasala User 2 (ID: 18) 
UPDATE nenasa_users 
SET 
    parentEmail = 'parent2@nenasala.lk',
    parentName = 'Parent of Nenasala User 2'
WHERE id = 18;

-- Update Nenasala User 2 (ID: 19)
UPDATE nenasa_users 
SET 
    parentEmail = 'parent3@nenasala.lk', 
    parentName = 'Parent of Nenasala User 2'
WHERE id = 19;

-- If using Student table instead, use these queries:
-- (Check if your student data is in 'student' table)

-- INSERT INTO student (name, email, registerNumber, parentEmail, parentName) VALUES
-- ('Test Student 1', 'student1@nenasala.lk', 'STD001', 'parent1@nenasala.lk', 'Parent One'),
-- ('Test Student 2', 'student2@nenasala.lk', 'STD002', 'parent2@nenasala.lk', 'Parent Two'),
-- ('Test Student 3', 'student3@nenasala.lk', 'STD003', 'parent3@nenasala.lk', 'Parent Three');

-- Verify the updates
SELECT id, display_name, email, parentEmail, parentName 
FROM nenasa_users 
WHERE role = 'student' AND parentEmail IS NOT NULL;

-- Test query to check if parent emails exist
SELECT 
    u.id,
    u.display_name,
    u.email,
    u.parentEmail,
    u.parentName,
    CASE 
        WHEN u.parentEmail IS NOT NULL THEN 'Has Parent Email in User table'
        ELSE 'No Parent Email in User table'
    END as email_status
FROM nenasa_users u 
WHERE u.role = 'student' 
ORDER BY u.id;

-- If you want to use a test email address (like your own) for testing:
-- Replace 'parent1@nenasala.lk' with 'tharakamahesh806@gmail.com' to receive test emails

UPDATE nenasa_users 
SET 
    parentEmail = 'tharakamahesh806@gmail.com',
    parentName = 'Test Parent for Nenasala User 1'
WHERE id = 17;

UPDATE nenasa_users 
SET 
    parentEmail = 'tharakamahesh806@gmail.com',
    parentName = 'Test Parent for Nenasala User 2'  
WHERE id = 18;

UPDATE nenasa_users
SET 
    parentEmail = 'tharakamahesh806@gmail.com',
    parentName = 'Test Parent for Nenasala User 2'
WHERE id = 19;