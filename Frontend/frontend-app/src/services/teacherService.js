// Teacher service for API calls
const API_BASE_URL = "http://localhost:8000";

// Create a new teacher
export const createTeacher = async (teacherData) => {
  try {
    const formData = new FormData();
    Object.keys(teacherData).forEach(key => {
      if (key === 'profileImage' && teacherData[key]) {
        formData.append(key, teacherData[key]);
      } else if (teacherData[key] !== null && teacherData[key] !== undefined) {
        formData.append(key, teacherData[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/teacher`, {
      method: "POST",
      body: formData, // No 'Content-Type' header, browser sets it for FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create teacher");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating teacher:", error);
    throw error;
  }
};

// Get all teachers
export const getAllTeachers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch teachers");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }
};

// Get teacher by ID
export const getTeacherById = async (teacherId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch teacher");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching teacher:", error);
    throw error;
  }
};

// Update teacher
export const updateTeacher = async (teacherId, teacherData) => {
  try {
    const formData = new FormData();
    Object.keys(teacherData).forEach(key => {
      if (key === 'profileImage' && teacherData[key] instanceof File) {
        formData.append('profileImage', teacherData[key]);
      } else if (teacherData[key] !== null && teacherData[key] !== undefined) {
        formData.append(key, teacherData[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
      method: "PUT",
      body: formData, // No 'Content-Type' header, browser sets it for FormData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update teacher");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
};

// Delete teacher
export const deleteTeacher = async (teacherId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete teacher");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
};

// Helper function to map frontend form data to backend format
export const mapFormDataToTeacherDto = (formData, classes = []) => {
  // Map selectedClasses to class names for sub_01, sub_02, etc.
  const selectedClassNames = formData.selectedClasses
    .map((classId) => {
      const classItem = classes.find((c) => c.id === classId);
      return classItem ? classItem.subject : null;
    })
    .filter(Boolean)
    .slice(0, 4); // Limit to 4 classes

  const teacherDto = {
    name: formData.name,
    email: formData.email,
    registerNumber: formData.registrationNumber,
    contactNumber: formData.contact,
    sub_01: selectedClassNames[0] || null,
    sub_02: selectedClassNames[1] || null,
    sub_03: selectedClassNames[2] || null,
    sub_04: selectedClassNames[3] || null,
    profileImage: formData.profileImage, // Pass the file object
  };

  return teacherDto;
};

// Helper function to map backend teacher data to frontend format
export const mapTeacherToFormData = (teacher, classes = []) => {
  // Map sub_01, sub_02, etc. back to selectedClasses IDs
  const subjectNames = [
    teacher.sub_01,
    teacher.sub_02,
    teacher.sub_03,
    teacher.sub_04,
  ].filter(Boolean);

  const selectedClasses = subjectNames
    .map((subjectName) => {
      const classItem = classes.find((c) => c.subject === subjectName);
      return classItem ? classItem.id : null;
    })
    .filter(Boolean);

  return {
    name: teacher.name || "",
    email: teacher.email || "",
    registrationNumber: teacher.registerNumber || "",
    contact: teacher.contactNumber || "",
    selectedClasses: selectedClasses,
    profileImage: teacher.profileImage || null,
  };
};
