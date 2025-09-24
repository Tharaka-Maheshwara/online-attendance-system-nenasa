# Email Notification Setup Guide

## Overview
The attendance system automatically sends email notifications to parents when their children's attendance is marked (present, absent, or late).

## Configuration Options

### Option 1: Gmail Configuration (Recommended for Testing)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Update your `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM_NAME=Nenasala Attendance System
```

### Option 2: SendGrid Configuration (Recommended for Production)
1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key
3. Update your `.env` file:
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_USER=your_verified_sender@yourdomain.com
EMAIL_FROM_NAME=Nenasala Attendance System
```

### Option 3: Other SMTP Providers
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your_email@your-provider.com
EMAIL_PASS=your_password
EMAIL_FROM_NAME=Nenasala Attendance System
```

## Testing the Email System

### 1. Test Email Connection
```bash
POST /api/notifications/test-email
Content-Type: application/json
```

### 2. Send Test Email
```bash
POST /api/notifications/send-test-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

### 3. Manual Attendance Notification
```bash
POST /api/notifications/send-attendance
Content-Type: application/json

{
  "studentName": "John Doe",
  "parentEmail": "parent@example.com",
  "classId": 1,
  "studentId": 123,
  "isPresent": true,
  "date": "2024-01-15"
}
```

## Email Templates

The system sends beautifully formatted HTML emails with:
- School branding
- Student information
- Attendance status (Present/Absent/Late)
- Date and time
- Class information

## Automatic Notifications

Email notifications are automatically sent when:
1. **Student attendance is marked** - Immediate notification
2. **Bulk attendance is processed** - Notifications for all students
3. **Absent students are marked** - Notifications for missing students

## Troubleshooting

### Common Issues:
1. **Email not sending**: Check email credentials in `.env`
2. **Gmail not working**: Ensure App Password is used, not regular password
3. **HTML not displaying**: Check if email client supports HTML

### Logs
Check the console logs for detailed error messages:
```bash
npm run start:dev
```

## Security Considerations

1. **Never commit email credentials** to version control
2. **Use App Passwords** for Gmail instead of account passwords
3. **Use environment variables** for all sensitive data
4. **Monitor email quotas** to avoid hitting send limits

## Production Deployment

For production environments:
1. Use SendGrid or similar professional email service
2. Set up proper DNS records (SPF, DKIM)
3. Monitor email delivery rates
4. Implement email queue system for high volume

## Email Content Customization

The email templates can be customized in:
`src/notification/notification.service.ts` → `createAttendanceEmailTemplate()`

You can modify:
- School logo and branding
- Email styling and colors
- Message content
- Additional information fields