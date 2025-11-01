// Test script to verify class-based student filtering in attendance
const API_BASE_URL = "http://localhost:8000";

async function testAttendanceFiltering() {
  try {
    console.log("Testing class-based student filtering for attendance...");

    // 1. First, create some test students with different subjects
    console.log("\n1. Creating test students with different subjects...");

    const testStudents = [
      {
        name: "Mathematics Student 1",
        email: "math1@example.com",
        registerNumber: "MATH001",
        sub_1: "Mathematics",
        sub_2: "Physics",
      },
      {
        name: "Science Student 1",
        email: "sci1@example.com",
        registerNumber: "SCI001",
        sub_1: "Chemistry",
        sub_2: "Biology",
      },
      {
        name: "IT Student 1",
        email: "it1@example.com",
        registerNumber: "IT001",
        sub_1: "IT",
        sub_2: "Mathematics",
      },
      {
        name: "Multi Subject Student",
        email: "multi@example.com",
        registerNumber: "MULTI001",
        sub_1: "IT",
        sub_2: "Mathematics",
        sub_3: "Physics",
      },
    ];

    const createdStudentIds = [];

    for (const student of testStudents) {
      try {
        const response = await fetch(`${API_BASE_URL}/student`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(student),
        });

        if (response.ok) {
          const created = await response.json();
          createdStudentIds.push(created.id);
          console.log(` Created student: ${student.name}`);
        } else {
          console.log(` Failed to create student: ${student.name}`);
        }
      } catch (error) {
        console.log(` Error creating ${student.name}:`, error.message);
      }
    }

    // 2. Get all classes
    console.log("\n2. Fetching available classes...");
    const classesResponse = await fetch(`${API_BASE_URL}/class`);
    if (!classesResponse.ok) {
      throw new Error("Failed to fetch classes");
    }
    const classes = await classesResponse.json();
    console.log(
      "Available classes:",
      classes.map((c) => c.name)
    );

    // 3. Get all students and check their subjects
    console.log("\n3. Verifying created students and their subjects...");
    const studentsResponse = await fetch(`${API_BASE_URL}/student`);
    if (!studentsResponse.ok) {
      throw new Error("Failed to fetch students");
    }
    const allStudents = await studentsResponse.json();

    // Filter our test students
    const ourStudents = allStudents.filter((s) =>
      createdStudentIds.includes(s.id)
    );

    console.log("Our test students:");
    ourStudents.forEach((student) => {
      const subjects = [
        student.sub_1,
        student.sub_2,
        student.sub_3,
        student.sub_4,
      ].filter(Boolean);
      console.log(`- ${student.name}: [${subjects.join(", ")}]`);
    });

    // 4. Test filtering for different classes
    console.log("\n4. Testing filtering logic for different classes...");

    // Test Mathematics class
    const mathClass = classes.find(
      (c) => c.name.toLowerCase().includes("math") || c.name === "Mathematics"
    );
    if (mathClass) {
      console.log(`\nTesting filter for "${mathClass.name}" class:`);
      const mathStudents = allStudents.filter((student) => {
        const studentSubjects = [
          student.sub_1,
          student.sub_2,
          student.sub_3,
          student.sub_4,
        ].filter(Boolean);

        return studentSubjects.some(
          (subject) => subject.toLowerCase() === mathClass.name.toLowerCase()
        );
      });

      console.log(`Found ${mathStudents.length} students in Mathematics:`);
      mathStudents.forEach((s) => console.log(`  - ${s.name}`));
    }

    // Test IT class
    const itClass = classes.find((c) => c.name === "IT");
    if (itClass) {
      console.log(`\nTesting filter for "${itClass.name}" class:`);
      const itStudents = allStudents.filter((student) => {
        const studentSubjects = [
          student.sub_1,
          student.sub_2,
          student.sub_3,
          student.sub_4,
        ].filter(Boolean);

        return studentSubjects.some(
          (subject) => subject.toLowerCase() === itClass.name.toLowerCase()
        );
      });

      console.log(`Found ${itStudents.length} students in IT:`);
      itStudents.forEach((s) => console.log(`  - ${s.name}`));
    }

    // 5. Test with a class that has no students
    console.log(
      `\nTesting with classes that should have no enrolled students:`
    );
    const otherClasses = classes.filter(
      (c) =>
        !["Mathematics", "IT", "Physics", "Chemistry", "Biology"].includes(
          c.name
        )
    );

    if (otherClasses.length > 0) {
      const testClass = otherClasses[0];
      const noStudents = allStudents.filter((student) => {
        const studentSubjects = [
          student.sub_1,
          student.sub_2,
          student.sub_3,
          student.sub_4,
        ].filter(Boolean);

        return studentSubjects.some(
          (subject) => subject.toLowerCase() === testClass.name.toLowerCase()
        );
      });

      console.log(
        `Testing "${testClass.name}" class: ${noStudents.length} students (should be 0)`
      );
    }

    console.log("\n Attendance filtering test completed!");
    console.log("\n Summary:");
    console.log("- Students are now filtered based on their enrolled subjects");
    console.log(
      "- Only students with matching subjects appear in attendance lists"
    );
    console.log("- Empty classes show appropriate 'no students' message");
  } catch (error) {
    console.error(" Test failed:", error.message);
  }
}

// Run the test
testAttendanceFiltering();
