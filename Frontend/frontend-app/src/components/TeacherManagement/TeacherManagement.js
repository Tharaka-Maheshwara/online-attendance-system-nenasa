import React, { useState, useEffect } from "react";
import "./TeacherManagement.css";
import { getUserByRegisterNumber } from "../../services/userService";
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  mapFormDataToTeacherDto,
  mapTeacherToFormData,
} from "../../services/teacherService";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLookingUpUser, setIsLookingUpUser] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    contact: "",
    sub_01: "",
    sub_02: "",
    sub_03: "",
    sub_04: "",
    profileImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      const teachersData = await getAllTeachers();
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error loading teachers:", error);
      // Set empty array on error so component doesn't break
      setTeachers([]);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, PNG, and GIF files are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.");
        return;
      }

      setFormData((prev) => ({ ...prev, profileImage: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      // Validate that at least one subject is provided
      const hasAtLeastOneSubject =
        formData.sub_01 ||
        formData.sub_02 ||
        formData.sub_03 ||
        formData.sub_04;

      if (!hasAtLeastOneSubject) {
        alert("Please provide at least one subject.");
        setIsSubmitting(false);
        return;
      }

      // Convert form data to backend format
      const teacherDto = mapFormDataToTeacherDto(formData);

      if (isEditing && editingId) {
        // Update existing teacher
        await updateTeacher(editingId, teacherDto);
        alert("Teacher updated successfully!");
      } else {
        // Create new teacher
        await createTeacher(teacherDto);
        alert("Teacher created successfully!");
      }

      // Reset form after successful submission
      handleCancel();

      // Reload teachers list
      await loadTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);

      // Show user-friendly error message
      let errorMessage = `Error ${
        isEditing ? "updating" : "creating"
      } teacher. Please try again.`;
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        errorMessage =
          "A teacher with this email or register number already exists.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
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
      sub_01: "",
      sub_02: "",
      sub_03: "",
      sub_04: "",
      profileImage: null,
    });
    setImagePreview(null);
    setShowAddForm(false);
    setIsLookingUpUser(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = async (teacherId) => {
    try {
      // Find the teacher in our current list
      const teacherToEdit = teachers.find(
        (teacher) => teacher.id === teacherId
      );
      if (teacherToEdit) {
        // Map the teacher data to form data format
        const formData = mapTeacherToFormData(teacherToEdit);

        // Populate the form with teacher data
        setFormData(formData);
        if (teacherToEdit.profileImage) {
          setImagePreview(`http://localhost:8000${teacherToEdit.profileImage}`);
        }
        setIsEditing(true);
        setEditingId(teacherId);
        setShowAddForm(true); // Show the form for editing

        // Scroll to form
        const formElement = document.querySelector(".teacher-form");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (error) {
      console.error("Error preparing edit:", error);
      alert("Error preparing teacher data for editing");
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await deleteTeacher(teacherId);
        await loadTeachers(); // Reload the teachers list
        alert("Teacher deleted successfully!");
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Error deleting teacher. Please try again.");
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
          <h3>{isEditing ? "Edit Teacher" : "Add New Teacher"}</h3>
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

            <div className="form-row">
              <div className="form-group image-upload-group">
                <label>Profile Image:</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                  />
                  <div className="image-upload-info">
                    <span>📷 Choose teacher photo (Max 5MB)</span>
                    <small>Supported formats: JPEG, PNG, GIF</small>
                  </div>
                </div>
                {imagePreview && (
                  <div className="image-preview">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData((prev) => ({
                          ...prev,
                          profileImage: null,
                        }));
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sub_01">Subject 1 *</label>
                <input
                  type="text"
                  id="sub_01"
                  name="sub_01"
                  value={formData.sub_01}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub_02">Subject 2</label>
                <input
                  type="text"
                  id="sub_02"
                  name="sub_02"
                  value={formData.sub_02}
                  onChange={handleInputChange}
                  placeholder="e.g., Science"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sub_03">Subject 3</label>
                <input
                  type="text"
                  id="sub_03"
                  name="sub_03"
                  value={formData.sub_03}
                  onChange={handleInputChange}
                  placeholder="e.g., English"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub_04">Subject 4</label>
                <input
                  type="text"
                  id="sub_04"
                  name="sub_04"
                  value={formData.sub_04}
                  onChange={handleInputChange}
                  placeholder="e.g., History"
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
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Teacher"
                  : "Create Teacher"}
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
                  <th>Photo</th>
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
                    <td>
                      {teacher.profileImage ? (
                        <img
                          src={`http://localhost:8000${teacher.profileImage}`}
                          alt={teacher.name}
                          className="teacher-image"
                        />
                      ) : (
                        <div className="teacher-image-placeholder">👤</div>
                      )}
                    </td>
                    <td>{teacher.registerNumber}</td>
                    <td>{teacher.name}</td>
                    <td>{teacher.email}</td>
                    <td>{teacher.contactNumber}</td>
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
