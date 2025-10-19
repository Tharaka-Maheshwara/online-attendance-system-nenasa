// Simple test to check if teachers API is working
const fetch = require("node-fetch");

async function testTeachersAPI() {
  try {
    console.log("Testing teachers API...");
    const response = await fetch("http://localhost:8000/course/teachers/all");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const teachers = await response.json();
    console.log("Teachers API Response:", teachers);
    console.log("Number of teachers:", teachers.length);

    if (teachers.length > 0) {
      console.log("First teacher:", teachers[0]);
      console.log(
        "Teacher has name field:",
        teachers[0].hasOwnProperty("name")
      );
      console.log("Teacher name value:", teachers[0].name);
    }
  } catch (error) {
    console.error("Error testing teachers API:", error);
  }
}

testTeachersAPI();
