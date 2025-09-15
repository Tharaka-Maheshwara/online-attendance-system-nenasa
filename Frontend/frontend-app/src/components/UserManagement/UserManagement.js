import React, { useState, useEffect } from "react";
import "./UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    display_name: "",
    email: "",
    role: "student",
    contactNumber: "",
    register_number: "",
    parentEmail: "",
    parentName: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-fill functionality for register number lookup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newUser.register_number && newUser.register_number.length > 2) {
        lookupUserByRegisterNumber(newUser.register_number);
      } else {
        setLookupMessage("");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [newUser.register_number]);

  const lookupUserByRegisterNumber = async (registerNumber) => {
    if (!registerNumber.trim()) return;

    setLookupLoading(true);
    setLookupMessage("");

    try {
      const response = await fetch(
        `http://localhost:8000/users/by-register/${registerNumber}`
      );

      if (response.ok) {
        const responseData = await response.json();

        // Handle the wrapped response format { success: true, user: {...} }
        if (responseData.success && responseData.user) {
          const userData = responseData.user;

          // Auto-fill name and email fields
          setNewUser((prev) => ({
            ...prev,
            display_name: userData.display_name || "",
            email: userData.email || "",
          }));
          setLookupMessage(
            `✅ Found: ${userData.display_name} (${userData.email})`
          );
        } else {
          setLookupMessage("⚠️ Unexpected response format");
        }
      } else if (response.status === 404) {
        setLookupMessage("ℹ️ Register number not found - creating new user");
        // Don't clear existing data, user might be creating a new record
      } else {
        setLookupMessage("⚠️ Error looking up register number");
      }
    } catch (error) {
      console.error("Error looking up user:", error);
      setLookupMessage("⚠️ Error connecting to server");
    } finally {
      setLookupLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("User created successfully!");
        setNewUser({
          display_name: "",
          email: "",
          role: "student",
          contactNumber: "",
          register_number: "",
          parentEmail: "",
          parentName: "",
        });
        setShowAddForm(false);
        fetchUsers();
      } else {
        alert("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user");
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (user) => {
    if (!user.parentEmail) {
      alert("No parent email found for this student");
      return;
    }

    try {
      const response = await fetch("/api/notifications/send-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: user.display_name,
          parentEmail: user.parentEmail,
          classId: 1, // Example class ID
          studentId: user.id,
          isPresent: true,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Test notification sent successfully!");
      } else {
        alert("Failed to send notification: " + result.message);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Error sending notification");
    }
  };

  return (
    <div className="user-management">
      <div className="header">
        <h2>User Management</h2>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New User"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-user-form">
          <h3>Add New User</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="display_name"
                  value={newUser.display_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Register Number:</label>
                <div className="register-input-container">
                  <input
                    type="text"
                    name="register_number"
                    value={newUser.register_number}
                    onChange={handleInputChange}
                    placeholder="e.g., 131584"
                  />
                  {lookupLoading && (
                    <span className="lookup-loading">🔍 Looking up...</span>
                  )}
                </div>
                {lookupMessage && (
                  <div
                    className={`lookup-message ${
                      lookupMessage.includes("✅")
                        ? "success"
                        : lookupMessage.includes("ℹ️")
                        ? "info"
                        : "warning"
                    }`}
                  >
                    {lookupMessage}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Number:</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={newUser.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {newUser.role === "student" && (
              <div className="form-row">
                <div className="form-group">
                  <label>Parent Name:</label>
                  <input
                    type="text"
                    name="parentName"
                    value={newUser.parentName}
                    onChange={handleInputChange}
                    placeholder="Parent/Guardian name"
                  />
                </div>
                <div className="form-group">
                  <label>Parent Email:</label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={newUser.parentEmail}
                    onChange={handleInputChange}
                    placeholder="Parent email for notifications"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        <h3>Users</h3>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Register Number</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Parent Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.display_name}</td>
                  <td>{user.email}</td>
                  <td>{user.register_number || "N/A"}</td>
                  <td>{user.role}</td>
                  <td>{user.contactNumber || "N/A"}</td>
                  <td>{user.parentEmail || "N/A"}</td>
                  <td>
                    {user.role === "student" && user.parentEmail && (
                      <button
                        className="test-btn"
                        onClick={() => sendTestNotification(user)}
                      >
                        Test Notification
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
