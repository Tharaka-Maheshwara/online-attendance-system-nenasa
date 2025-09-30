const { createConnection } = require('typeorm');
const nodemailer = require('nodemailer');

// Test email notification functionality
async function testEmailNotification() {
  console.log('🔧 Testing Email Notification System...\n');

  // Test email configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'tharakamahesh806@gmail.com',
      pass: 'ezbd nete bizh uznf',
    },
  });

  try {
    // Verify transporter configuration
    console.log('📧 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📤 Sending test attendance notification...');
    const testEmail = 'tharakamahesh806@gmail.com'; // Replace with actual parent email

    const mailOptions = {
      from: 'Nenasala Attendance System <tharakamahesh806@gmail.com>',
      to: testEmail,
      subject: '✅ Attendance Notification Test - Student Name',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .status { font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 20px; font-weight: bold; color: #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏫 Nenasala Attendance System</div>
              <h2>Attendance Notification</h2>
            </div>
            
            <p>Dear Parent,</p>
            
            <div class="details">
              <p><strong>Student:</strong> Test Student Name</p>
              <p><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
              <p><strong>Class ID:</strong> 1</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <div class="status">✅ Status: PRESENT</div>
            </div>
            
            <p>Your child was marked <strong style="color: #28a745;">PRESENT</strong> in class today.</p>
            
            <div class="footer">
              <p>Best regards,<br>Nenasala School Administration</p>
              <p><em>This is an automated message. Please do not reply to this email.</em></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📋 Message ID:', info.messageId);
    console.log('📧 Email sent to:', testEmail);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('📝 Details:', error);
  }
}

// Run the test
testEmailNotification()
  .then(() => {
    console.log('\n🎯 Email notification test completed!');
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
  });
