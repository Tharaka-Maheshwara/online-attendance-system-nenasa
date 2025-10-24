// Test script for all classes API
const API_BASE_URL = "http://localhost:8000";

async function testAllClassesAPI() {
  try {
    console.log("Testing all classes API endpoints...");

    // First, get a list of students to test with
    console.log("\n📋 Getting students list...");
    
    const studentsResponse = await fetch(`${API_BASE_URL}/student`);
    
    if (studentsResponse.ok) {
      const students = await studentsResponse.json();
      console.log(`Found ${students.length} students`);
      
      if (students.length > 0) {
        const testStudent = students[0];
        console.log(`\n🧪 Testing with student: ${testStudent.name} (${testStudent.email})`);
        console.log(`Student subjects: ${[testStudent.sub_1, testStudent.sub_2, testStudent.sub_3, testStudent.sub_4, testStudent.sub_5, testStudent.sub_6].filter(s => s).join(', ') || 'None'}`);
        
        // Test the new all classes endpoint
        console.log("\n📚 Testing all classes endpoint by email...");
        const allClassesResponse = await fetch(
          `${API_BASE_URL}/student/email/${encodeURIComponent(testStudent.email)}/classes/all`
        );
        
        if (allClassesResponse.ok) {
          const allClasses = await allClassesResponse.json();
          console.log(`✅ Found ${allClasses.length} total classes for student`);
          
          if (allClasses.length > 0) {
            console.log("\n📅 Classes by day:");
            const classesByDay = {};
            
            allClasses.forEach(cls => {
              const day = cls.dayOfWeek || 'TBA';
              if (!classesByDay[day]) {
                classesByDay[day] = [];
              }
              classesByDay[day].push(cls);
            });
            
            Object.keys(classesByDay).forEach(day => {
              console.log(`\n  ${day}:`);
              classesByDay[day].forEach(cls => {
                console.log(`    - ${cls.subject} (Grade ${cls.grade || 'N/A'})`);
                console.log(`      Time: ${cls.startTime || 'TBA'} - ${cls.endTime || 'TBA'}`);
                console.log(`      Teacher: ${cls.teacherName || 'TBA'}`);
                if (cls.monthlyFees) {
                  console.log(`      Fee: Rs. ${cls.monthlyFees}`);
                }
              });
            });
            
            // Compare with today's classes
            console.log("\n🔄 Comparing with today's classes...");
            const todayResponse = await fetch(
              `${API_BASE_URL}/student/email/${encodeURIComponent(testStudent.email)}/classes/today`
            );
            
            if (todayResponse.ok) {
              const todayClasses = await todayResponse.json();
              const today = new Date();
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const todayDayOfWeek = daysOfWeek[today.getDay()];
              
              console.log(`Today is: ${todayDayOfWeek}`);
              console.log(`Today's classes: ${todayClasses.length}`);
              console.log(`All classes for ${todayDayOfWeek}: ${(classesByDay[todayDayOfWeek] || []).length}`);
              
              if (todayClasses.length === (classesByDay[todayDayOfWeek] || []).length) {
                console.log("✅ Today's classes count matches expected count");
              } else {
                console.log("⚠️ Today's classes count doesn't match");
              }
            }
          } else {
            console.log("📝 No classes found for this student");
          }
        } else {
          console.error(`❌ Failed to get all classes: ${allClassesResponse.status}`);
        }
        
        // Test by ID endpoint as well
        console.log(`\n🆔 Testing all classes endpoint by student ID: ${testStudent.id}...`);
        const allClassesByIdResponse = await fetch(
          `${API_BASE_URL}/student/${testStudent.id}/classes/all`
        );
        
        if (allClassesByIdResponse.ok) {
          const allClassesById = await allClassesByIdResponse.json();
          console.log(`✅ Found ${allClassesById.length} classes by ID`);
        } else {
          console.error(`❌ Failed to get all classes by ID: ${allClassesByIdResponse.status}`);
        }
        
      } else {
        console.log("❌ No students found to test with");
      }
    } else {
      console.error(`❌ Failed to get students: ${studentsResponse.status}`);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
console.log("🚀 Starting all classes API test...");
testAllClassesAPI();