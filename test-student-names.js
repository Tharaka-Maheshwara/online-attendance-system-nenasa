// Test script to verify student with subject names functionality
const API_BASE_URL = "http://localhost:8000";

// Test data with subject names instead of IDs
const testStudent = {
  name: "Test Student with Subject Names",
  email: "testnames@example.com", 
  registerNumber: "TSN123456",
  contactNumber: "0771234567",
  parentName: "Parent Name",
  parentEmail: "parent@example.com",
  sub_1: "Mathematics", // Class name instead of ID
  sub_2: "Science", // Class name instead of ID
  sub_3: null, // Optional
  sub_4: null  // Optional
};

async function testStudentWithSubjectNames() {
  try {
    console.log("Testing student creation with subject names...");
    console.log("Test data:", testStudent);
    
    // Create student
    const createResponse = await fetch(`${API_BASE_URL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testStudent),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create student: ${createResponse.status} - ${errorText}`);
    }

    const createdStudent = await createResponse.json();
    console.log("✅ Student created successfully:", createdStudent);

    // Get student to verify subject names are stored
    const getResponse = await fetch(`${API_BASE_URL}/student/${createdStudent.id}`);
    const student = await getResponse.json();
    
    console.log("Student retrieved:", student);
    
    // Verify subject names are stored correctly
    if (student.sub_1 === "Mathematics" && student.sub_2 === "Science") {
      console.log("✅ Subject names successfully stored and retrieved");
      console.log(`Sub 1: ${student.sub_1}`);
      console.log(`Sub 2: ${student.sub_2}`);
    } else {
      console.log("❌ Subject names not stored correctly");
      console.log(`Expected: Mathematics, Science`);
      console.log(`Got: ${student.sub_1}, ${student.sub_2}`);
    }

    // Get all students to verify the list includes subject names
    const allStudentsResponse = await fetch(`${API_BASE_URL}/student`);
    const allStudents = await allStudentsResponse.json();
    
    const ourStudent = allStudents.find(s => s.id === createdStudent.id);
    if (ourStudent && ourStudent.sub_1 === "Mathematics") {
      console.log("✅ Subject names appear correctly in student list");
    } else {
      console.log("❌ Subject names not showing in student list");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testStudentWithSubjectNames();