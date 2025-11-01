// Test script to verify the student with subjects functionality
const API_BASE_URL = "http://localhost:8000";

// Test data
const testStudent = {
  name: "Test Student with Subjects",
  email: "testsubject@example.com",
  registerNumber: "TS123456",
  contactNumber: "0771234567",
  parentName: "Parent Name",
  parentEmail: "parent@example.com",
  sub_1_id: 1, // Assuming class ID 1 exists
  sub_2_id: 2, // Assuming class ID 2 exists
  sub_3_id: null, // Optional
  sub_4_id: null, // Optional
};

async function testStudentWithSubjects() {
  try {
    console.log("Testing student creation with subjects...");

    // Create student
    const createResponse = await fetch(`${API_BASE_URL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testStudent),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create student: ${createResponse.status}`);
    }

    const createdStudent = await createResponse.json();
    console.log("Student created successfully:", createdStudent);

    // Get student with subjects
    const getResponse = await fetch(
      `${API_BASE_URL}/student/${createdStudent.id}`
    );
    const studentWithSubjects = await getResponse.json();

    console.log("Student with subjects:", studentWithSubjects);

    // Verify subjects are loaded
    if (studentWithSubjects.sub_1 || studentWithSubjects.sub_2) {
      console.log(" Subjects successfully loaded with student");
    } else {
      console.log(" Subjects not loaded with student");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
testStudentWithSubjects();
