// Course service for API calls
const API_BASE_URL = "http://localhost:8000";

// Get all courses
export const getAllCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/course`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

// Get active courses only
export const getActiveCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch active courses");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching active courses:", error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch course");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
};

// Create a new course
export const createCourse = async (courseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create course");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
};

// Update a course
export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update course");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

// Delete a course
export const deleteCourse = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete course");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

// Update enrollment count
export const updateEnrollmentCount = async (courseId, count) => {
  try {
    const response = await fetch(`${API_BASE_URL}/course/${courseId}/enrollment/${count}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to update enrollment count");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating enrollment count:", error);
    throw error;
  }
};