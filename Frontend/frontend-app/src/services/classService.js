// Class service for API calls
const API_BASE_URL = "http://localhost:8000";

// Get all classes
export const getAllClasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/class`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch classes");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

// Get class by ID
export const getClassById = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch class");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching class:", error);
    throw error;
  }
};

// Create a new class
export const createClass = async (classData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/class`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create class");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating class:", error);
    throw error;
  }
};

// Update a class
export const updateClass = async (classId, classData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update class");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

// Delete a class
export const deleteClass = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete class");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};