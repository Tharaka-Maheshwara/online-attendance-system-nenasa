// User service for API calls
const API_BASE_URL = "http://localhost:8000";

// Get user by register number
export const getUserByRegisterNumber = async (registerNumber) => {
  try {
    if (!registerNumber || registerNumber.trim() === "") {
      return null;
    }

    const response = await fetch(
      `${API_BASE_URL}/users/by-register/${encodeURIComponent(registerNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // User not found - this is expected, return null
        return null;
      }
      throw new Error("Failed to fetch user by register number");
    }

    const result = await response.json();
    return result.success ? result.user : null;
  } catch (error) {
    console.error("Error fetching user by register number:", error);
    // Don't throw error for user not found cases
    if (error.message.includes("404") || error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Get user profile by email
export const getUserProfileByEmail = async (email) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/profile/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
