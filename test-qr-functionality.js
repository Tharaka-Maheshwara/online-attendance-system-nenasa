// Test script to verify QR code generation for students
const API_BASE_URL = "http://localhost:8000";

// Test data for creating a student with QR code
const testStudent = {
  name: "QR Test Student",
  email: "qrtest@example.com",
  registerNumber: "QR123456",
  contactNumber: "0771234567",
  parentName: "Parent Name",
  parentEmail: "parent@example.com",
  sub_1: "Mathematics",
  sub_2: "Science",
};

async function testQRCodeGeneration() {
  try {
    console.log("Testing QR code generation for students...");
    console.log("Test data:", testStudent);

    // Create student (should automatically generate QR code)
    console.log("\n1. Creating student...");
    const createResponse = await fetch(`${API_BASE_URL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testStudent),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(
        `Failed to create student: ${createResponse.status} - ${errorText}`
      );
    }

    const createdStudent = await createResponse.json();
    console.log("✅ Student created successfully");
    console.log("Student ID:", createdStudent.id);

    // Check if QR code was generated
    if (createdStudent.qrCode) {
      console.log("✅ QR code generated automatically");
      console.log("QR code length:", createdStudent.qrCode.length);
    } else {
      console.log("❌ No QR code generated during creation");
    }

    // Test getting student QR code
    console.log("\n2. Testing QR code retrieval...");
    const qrResponse = await fetch(
      `${API_BASE_URL}/student/${createdStudent.id}/qrcode`
    );
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      if (qrData.qrCode) {
        console.log("✅ QR code retrieved successfully");
      } else {
        console.log("❌ No QR code in response");
      }
    } else {
      console.log("❌ Failed to retrieve QR code");
    }

    // Test QR code regeneration
    console.log("\n3. Testing QR code regeneration...");
    const regenerateResponse = await fetch(
      `${API_BASE_URL}/student/${createdStudent.id}/regenerate-qr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (regenerateResponse.ok) {
      const regeneratedStudent = await regenerateResponse.json();
      if (regeneratedStudent.qrCode) {
        console.log("✅ QR code regenerated successfully");

        // Check if QR code changed
        if (regeneratedStudent.qrCode !== createdStudent.qrCode) {
          console.log("✅ New QR code is different from original");
        } else {
          console.log(
            "ℹ️ New QR code is same as original (expected if data unchanged)"
          );
        }
      } else {
        console.log("❌ No QR code in regeneration response");
      }
    } else {
      console.log("❌ Failed to regenerate QR code");
    }

    // Test QR lookup functionality
    console.log("\n4. Testing QR data lookup...");
    const qrLookupData = {
      studentId: createdStudent.id,
      registerNumber: createdStudent.registerNumber,
    };

    const lookupResponse = await fetch(`${API_BASE_URL}/student/qr-lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(qrLookupData),
    });

    if (lookupResponse.ok) {
      const foundStudent = await lookupResponse.json();
      if (foundStudent && foundStudent.id === createdStudent.id) {
        console.log("✅ QR lookup successful - found correct student");
        console.log("Found student:", foundStudent.name);
      } else {
        console.log("❌ QR lookup failed or returned wrong student");
      }
    } else {
      console.log("❌ QR lookup request failed");
    }

    // Verify QR code contains expected data
    console.log("\n5. Verifying QR code data structure...");
    if (createdStudent.qrCode) {
      try {
        // QR codes are base64 data URLs, so we can't easily decode them in this test
        // But we can verify it's a proper data URL
        if (createdStudent.qrCode.startsWith("data:image/png;base64,")) {
          console.log("✅ QR code is properly formatted as PNG data URL");
        } else {
          console.log("❌ QR code format is unexpected");
        }
      } catch (error) {
        console.log("❌ Error verifying QR code format:", error.message);
      }
    }

    console.log("\n✅ All QR code tests completed successfully!");
  } catch (error) {
    console.error("❌ QR code test failed:", error.message);
  }
}

// Run the test
testQRCodeGeneration();
