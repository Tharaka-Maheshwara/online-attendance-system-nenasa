const fetch = require('node-fetch');

// Test the email notification functionality
async function testAttendanceEmailNotification() {
  console.log('🧪 Testing Attendance Email Notification API...\n');
  
  const testCases = [
    {
      name: 'Test Present Status',
      data: {
        studentId: 17,
        classId: 1,
        status: 'present'
      }
    },
    {
      name: 'Test Absent Status',
      data: {
        studentId: 18,
        classId: 1,
        status: 'absent'
      }
    },
    {
      name: 'Test Late Status', 
      data: {
        studentId: 19,
        classId: 1,
        status: 'late'
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 ${testCase.name}:`);
      console.log('Data:', testCase.data);

      const response = await fetch('http://localhost:8000/attendance/test-email-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Success:', result.message);
        console.log('📊 Attendance ID:', result.attendanceId);
        console.log('📧 Email should have been sent to parent!');
      } else {
        console.log('❌ Failed:', result.message);
        console.log('📝 Error:', result.error);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('💥 Request failed:', error.message);
    }
  }

  console.log('\n🎯 Email notification testing completed!');
}

// Test direct email notification endpoint
async function testDirectEmailNotification() {
  console.log('\n📧 Testing Direct Email Notification...\n');
  
  try {
    const response = await fetch('http://localhost:8000/notifications/send-attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentName: 'Test Student',
        parentEmail: 'tharakamahesh806@gmail.com',
        classId: 1,
        studentId: 999,
        isPresent: true,
        date: new Date().toISOString().split('T')[0]
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Direct email sent successfully!');
      console.log('📧 Check email inbox for notification');
    } else {
      console.log('❌ Direct email failed:', result.message);
    }
  } catch (error) {
    console.error('💥 Direct email test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Email Notification Tests...\n');
  console.log('ℹ️  Make sure the backend server is running on http://localhost:8000');
  console.log('ℹ️  Make sure parent emails are set up in the database\n');
  
  // Test direct email first
  await testDirectEmailNotification();
  
  // Test attendance-triggered emails
  await testAttendanceEmailNotification();
  
  console.log('\n✨ All tests completed!');
  console.log('📬 Check email inbox: tharakamahesh806@gmail.com');
}

runAllTests().catch(console.error);