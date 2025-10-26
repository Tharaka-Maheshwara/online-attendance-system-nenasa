-- Test Monthly Payment Reset Functionality
-- This script creates payment records for previous month to test auto-reset

-- Example: Create a payment record for previous month (September 2025)
-- Replace studentId, classId with actual values from your database

-- Insert a 'paid' payment for previous month
INSERT INTO payment (studentId, classId, amount, month, year, status, paidDate, createdAt, updatedAt)
VALUES 
(1, 3, 1500.00, 9, 2025, 'paid', '2025-09-15', NOW(), NOW()),
(2, 3, 1500.00, 9, 2025, 'paid', '2025-09-20', NOW(), NOW());

-- Check existing payments
SELECT 
    p.id,
    p.studentId,
    s.name as studentName,
    p.classId,
    c.subject,
    p.amount,
    p.month,
    p.year,
    p.status,
    p.paidDate
FROM payment p
LEFT JOIN student s ON p.studentId = s.id
LEFT JOIN class c ON p.classId = c.id
ORDER BY p.year DESC, p.month DESC, p.studentId;

-- After running attendance marking for October 2025:
-- New 'pending' payment records should be automatically created for current month (October)
-- Previous month's 'paid' status remains unchanged

-- Query to verify new month payments
SELECT 
    p.id,
    p.studentId,
    s.name as studentName,
    p.classId,
    c.subject,
    p.amount,
    p.month,
    p.year,
    p.status,
    p.paidDate
FROM payment p
LEFT JOIN student s ON p.studentId = s.id
LEFT JOIN class c ON p.classId = c.id
WHERE p.month = 10 AND p.year = 2025
ORDER BY p.studentId;
