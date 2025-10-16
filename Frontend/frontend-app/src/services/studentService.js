// Student service for API calls
const API_BASE_URL = "http://localhost:8000";

// Create a new student
export const createStudent = async (studentData) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append all student fields to FormData
    Object.keys(studentData).forEach(key => {
      if (key === 'profileImage' && studentData[key]) {
        // Append the file
        formData.append('profileImage', studentData[key]);
      } else if (studentData[key] !== null && studentData[key] !== '') {
        // Append other fields
        formData.append(key, studentData[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/student`, {
      method: "POST",
      body: formData, // Use FormData instead of JSON
      // Don't set Content-Type header - let browser set it with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create student");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
};

// Get all students
export const getAllStudents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/student`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch students");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch student");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
};

// Update student
export const updateStudent = async (studentId, studentData) => {
  try {
    // Create FormData for file upload (if image is being updated)
    const isFormData = studentData.profileImage instanceof File;
    
    let requestBody;
    let headers = {};
    
    if (isFormData) {
      // Use FormData for image updates
      const formData = new FormData();
      Object.keys(studentData).forEach(key => {
        if (key === 'profileImage' && studentData[key]) {
          formData.append('profileImage', studentData[key]);
        } else if (studentData[key] !== null && studentData[key] !== '') {
          formData.append(key, studentData[key]);
        }
      });
      requestBody = formData;
      // Don't set Content-Type header for FormData
    } else {
      // Use JSON for regular updates
      requestBody = JSON.stringify(studentData);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
      method: "PUT",
      headers: headers,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update student");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (studentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete student");
    }

    return true;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};

// Lookup student by registration number
// Note: This uses the user service endpoint since there's no dedicated endpoint in student controller
export const lookupStudentByRegisterNumber = async (registerNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/by-register/${registerNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Student not found
      }
      throw new Error("Failed to lookup student");
    }

    return await response.json();
  } catch (error) {
    console.error("Error looking up student:", error);
    throw error;
  }
};
