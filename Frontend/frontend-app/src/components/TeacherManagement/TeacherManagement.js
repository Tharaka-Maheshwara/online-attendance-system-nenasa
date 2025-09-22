import React, { useState, useEffect } from "react";
import "./TeacherManagement.css";
import { getUserByRegisterNumber } from "../../services/userService";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLookingUpUser, setIsLookingUpUser] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    contact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();

    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (window.registerNumberTimeout) {
        clearTimeout(window.registerNumberTimeout);
      }
    };
  }, []);

  const loadTeachers = async () => {
    try {
      // For now, using a mock implementation
      // TODO: Replace with actual teacher service call
      setTeachers([]);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  // Function to lookup user by register number and auto-fill fields
  const lookupUserByRegisterNumber = async (registerNumber) => {
    if (!registerNumber || registerNumber.trim() === "") {
      return;
    }

    setIsLookingUpUser(true);
    try {
      const user = await getUserByRegisterNumber(registerNumber);

      if (user) {
        // Use the display_name directly as the single name field
        const displayName = user.display_name || "";

        // Auto-fill the form fields
        setFormData((prev) => ({
          ...prev,
          name: displayName,
          email: user.email || "",
        }));

        console.log("User found and auto-filled:", user);
      } else {
        console.log("No user found with register number:", registerNumber);
        // Don't show error for not found - this is normal when user doesn't exist
      }
    } catch (error) {
      console.error("Error looking up user:", error);
      // Show a subtle error message but don't block the user from continuing
      if (error.message && !error.message.includes("not found")) {
        console.warn(
          "Could not connect to server for user lookup. You can still create the teacher manually."
        );
      }
    } finally {
      setIsLookingUpUser(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If register number is being changed, lookup user for auto-fill
    if (name === "registrationNumber") {
      // Use setTimeout to debounce the API call
      clearTimeout(window.registerNumberTimeout);
      window.registerNumberTimeout = setTimeout(() => {
        lookupUserByRegisterNumber(value);
      }, 500); // Wait 500ms after user stops typing
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Mock teacher creation - replace with actual API call
      console.log("Creating teacher with data:", formData);

      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        registrationNumber: "",
        contact: "",
      });
      setShowAddForm(false);
      loadTeachers();

      alert("Teacher created successfully!");
    } catch (error) {
      console.error("Error creating teacher:", error);
      alert("Error creating teacher. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clear any pending register number lookup
    if (window.registerNumberTimeout) {
      clearTimeout(window.registerNumberTimeout);
    }

    setFormData({
      name: "",
      email: "",
      registrationNumber: "",
      contact: "",
    });
    setShowAddForm(false);
    setIsLookingUpUser(false);
  };

  const handleEdit = (teacherId) => {
    console.log("Edit teacher:", teacherId);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        console.log("Delete teacher:", teacherId);
        // TODO: Implement delete functionality
        loadTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Error deleting teacher");
      }
    }
  };

  return (
    <div className="teacher-management">
      <div className="header">
        <h2>Teacher Management</h2>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New Teacher"}
        </button>
      </div>

      {showAddForm && (
        <div className="add-teacher-form">
          <h3>Add New Teacher</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="registrationNumber">
                  Teacher ID *
                  {isLookingUpUser && (
                    <span className="lookup-indicator">
                      {" "}
                      (Looking up user...)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., T001"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact">Contact Number *</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn"
              >
                {isSubmitting ? "Creating..." : "Create Teacher"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="teachers-list">
        <h3>Teachers List</h3>
        {teachers.length === 0 ? (
          <div className="no-data">
            <p>No teachers found. Add a new teacher to get started.</p>
          </div>
        ) : (
          <div className="teachers-table">
            <table>
              <thead>
                <tr>
                  <th>Teacher ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.registrationNumber}</td>
                    <td>{teacher.name}</td>
                    <td>{teacher.email}</td>
                    <td>{teacher.contact}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(teacher.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
