// Test script for today's classes API
const API_BASE_URL = "http://localhost:8000";

async function testTodayClasses() {
  try {
    console.log("Testing today's classes API...");

    // Test with a sample email (you'll need to replace with actual student email)
    const testEmail = "testsubject@example.com"; // Replace with actual student email
    
    console.log(`Testing with email: ${testEmail}`);
    
    const response = await fetch(
      `${API_BASE_URL}/student/email/${encodeURIComponent(testEmail)}/classes/today`
    );
    
    if (response.ok) {
      const classes = await response.json();
      console.log("✅ API Response received:");
      console.log("Today's classes:", classes);
      
      if (classes.length > 0) {
        console.log("📚 Classes found for today:");
        classes.forEach((cls, index) => {
          console.log(`  ${index + 1}. ${cls.subject} - Grade ${cls.grade || 'N/A'}`);
          console.log(`     Time: ${cls.startTime || 'TBA'} - ${cls.endTime || 'TBA'}`);
          console.log(`     Teacher: ${cls.teacherName || 'TBA'}`);
          console.log(`     Day: ${cls.dayOfWeek || 'TBA'}`);
        });
      } else {
        console.log("📅 No classes scheduled for today");
      }
    } else {
      console.error("❌ API Error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Network/Script Error:", error.message);
  }
}

async function testStudentsList() {
  try {
    console.log("\n📋 Getting students list to find emails...");
    
    const response = await fetch(`${API_BASE_URL}/student`);
    
    if (response.ok) {
      const students = await response.json();
      console.log(`Found ${students.length} students:`);
      
      students.slice(0, 5).forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.name} (${student.email})`);
        console.log(`     Subjects: ${[student.sub_1, student.sub_2, student.sub_3, student.sub_4, student.sub_5, student.sub_6].filter(s => s).join(', ') || 'None'}`);
      });
      
      if (students.length > 0) {
        console.log(`\n🔧 Testing with first student: ${students[0].email}`);
        const testResponse = await fetch(
          `${API_BASE_URL}/student/email/${encodeURIComponent(students[0].email)}/classes/today`
        );
        
        if (testResponse.ok) {
          const todayClasses = await testResponse.json();
          console.log("✅ Today's classes for first student:", todayClasses);
        } else {
          console.error("❌ Error getting today's classes:", testResponse.status);
        }
      }
    } else {
      console.error("❌ Error getting students list:", response.status);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function testClassesList() {
  try {
    console.log("\n📚 Getting classes list to check schedule data...");
    
    const response = await fetch(`${API_BASE_URL}/class`);
    
    if (response.ok) {
      const classes = await response.json();
      console.log(`Found ${classes.length} classes:`);
      
      classes.slice(0, 5).forEach((cls, index) => {
        console.log(`  ${index + 1}. ${cls.subject} - Grade ${cls.grade || 'N/A'}`);
        console.log(`     Schedule: ${cls.dayOfWeek || 'TBA'} ${cls.startTime || 'TBA'} - ${cls.endTime || 'TBA'}`);
        console.log(`     Teacher: ${cls.teacherName || 'TBA'}`);
      });
      
      // Check today's day
      const today = new Date();
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayOfWeek = daysOfWeek[today.getDay()];
      
      console.log(`\n📅 Today is: ${todayDayOfWeek}`);
      
      const todayClasses = classes.filter(cls => cls.dayOfWeek === todayDayOfWeek);
      console.log(`📚 Classes scheduled for today (${todayDayOfWeek}):`, todayClasses.length);
      
      todayClasses.forEach((cls, index) => {
        console.log(`  ${index + 1}. ${cls.subject} - ${cls.startTime || 'TBA'} to ${cls.endTime || 'TBA'}`);
      });
      
    } else {
      console.error("❌ Error getting classes list:", response.status);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testClassesList();
  await testStudentsList();
  await testTodayClasses();
}

runAllTests();