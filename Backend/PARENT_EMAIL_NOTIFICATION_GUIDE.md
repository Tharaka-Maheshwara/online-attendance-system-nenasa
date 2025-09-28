# Parent Email Notification Feature

## Overview
The attendance system now automatically sends email notifications to parents whenever their child's attendance is marked (present, absent, or late).

## How It Works

### 1. Automatic Email Sending
- When a teacher or admin marks attendance for any student
- The system automatically looks up the parent's email address
- An email notification is sent immediately after attendance is saved
- Works for both individual attendance marking and bulk attendance saving

### 2. Parent Email Lookup
The system checks for parent email addresses in two places:
- **User Entity**: `parentEmail` field in the `nenasala_users` table
- **Student Entity**: `parentEmail` field in the `student` table

### 3. Email Content
The email includes:
- 🏫 School branding (Nenasala Attendance System)
- Student name
- Attendance status (Present ✅, Absent ⚠️, Late 🕐)
- Date and time
- Class information
- Professional formatting with school colors

### 4. Email Templates

#### Present Status Email
```
Subject: ✅ Attendance Confirmation - [Student Name]
Content: Your child [Student Name] was marked PRESENT in class today.
```

#### Absent Status Email  
```
Subject: ⚠️ Attendance Alert - [Student Name] Absent
Content: Your child [Student Name] was marked ABSENT from class today. Please contact the school if this is unexpected.
```

#### Late Status Email
```
Subject: 🕐 Attendance Notice - [Student Name] Late
Content: Your child [Student Name] was marked LATE for class today.
```

## Configuration

### Email Settings (Backend/.env)
```env
# Email Configuration (Gmail/SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Nenasala Attendance System
EMAIL_ENABLED=true
```

### Required Student Data
To receive emails, students must have:
- Valid parent email address in either:
  - `User.parentEmail` field, or  
  - `Student.parentEmail` field

## Features

### ✅ What's Working
- Automatic email sending on attendance marking
- Support for Present, Absent, and Late status
- Professional HTML email templates
- Error handling and logging
- Bulk attendance email notifications
- Email delivery confirmation

### 🔧 Technical Implementation
- **Backend**: NestJS with Nodemailer integration
- **Email Service**: Gmail SMTP (configurable)
- **Database**: Parent emails stored in User and Student entities
- **Triggers**: Attendance creation automatically triggers email
- **Logging**: Comprehensive logging for debugging

## Usage Examples

### Manual Attendance Marking
1. Teacher opens attendance marking page
2. Selects student and marks attendance (Present/Absent/Late)
3. Clicks "Save" button
4. ✅ Attendance is saved + 📧 Parent email is sent automatically
5. Success message shows "Parent email notification has been sent automatically"

### Bulk Attendance Marking  
1. Teacher marks attendance for all students in class
2. Clicks "Save All Attendance" button
3. ✅ All attendance records saved + 📧 Emails sent to all parents
4. Success message shows "Parent email notifications have been sent automatically to all students' parents"

### QR Code Attendance
1. Student scans QR code or teacher scans student's QR
2. Attendance is marked as "Present" automatically
3. 📧 Parent email notification is sent immediately

## Monitoring & Debugging

### Backend Logs
The system logs all email activities:
```
📝 Creating attendance record: [attendance data]
✅ Attendance saved with ID: [id]
📧 Attempting to send notification for attendance ID: [id]
📨 Sending attendance notification to [parent-email] for student [name]
📊 Attendance details - Status: [status], Date: [date], Class: [class-id]
✅ Email notification sent successfully!
```

### Failed Email Handling
- If parent email is not found: Logs warning but continues
- If email sending fails: Logs error but doesn't break attendance saving
- All failed notifications are logged to database for monitoring

### Test Endpoints
```bash
# Test email connection
POST /api/notifications/test-email

# Send test email
POST /api/notifications/send-test-email
Body: {"email": "test@example.com"}

# Manual attendance notification
POST /api/notifications/send-attendance
Body: {
  "studentName": "John Doe",
  "parentEmail": "parent@example.com", 
  "classId": 1,
  "studentId": 123,
  "isPresent": true,
  "date": "2024-01-15"
}
```

## Database Schema

### User Entity (nenasala_users)
```sql
parentEmail VARCHAR NULL  -- Parent's email address
parentName VARCHAR NULL   -- Parent's name
```

### Student Entity (student)
```sql
parentEmail VARCHAR NULL  -- Parent's email address  
parentName VARCHAR NULL   -- Parent's name
```

### Notification Entity (notification)
```sql
id SERIAL PRIMARY KEY
recipientEmail VARCHAR     -- Email sent to
subject VARCHAR           -- Email subject
message TEXT             -- Email content
type VARCHAR             -- 'email'
status VARCHAR           -- 'sent' or 'failed'
studentId INTEGER        -- Student ID
classId INTEGER          -- Class ID
errorMessage TEXT NULL   -- Error details if failed
createdAt TIMESTAMP      -- When sent
```

## Security & Privacy
- Parent emails are securely stored in database
- Email credentials stored in environment variables
- No sensitive information exposed in email content
- Automated emails clearly marked as system-generated
- No-reply email address to prevent spam replies

## Future Enhancements
- SMS notifications alongside email
- Parent portal for viewing attendance history
- Customizable email templates per school
- Multiple parent email addresses per student
- Email delivery status tracking
- Scheduled digest emails (daily/weekly summaries)