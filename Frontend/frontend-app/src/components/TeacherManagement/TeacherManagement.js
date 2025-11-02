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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 10;
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLookingUpUser, setIsLookingUpUser] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
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
      setLookupMessage("");
      return;
    }

    setIsLookingUpUser(true);
    setLookupMessage("");

    try {
      const user = await getUserByRegisterNumber(registerNumber);

      if (user) {
        // Check if user already has a role (admin, student, or teacher)
        if (user.role && (user.role === 'admin' || user.role === 'student' || user.role === 'teacher')) {
          setLookupMessage("⚠️ This Register Number Already Registered");
          // Clear name and email
          setFormData((prev) => ({
            ...prev,
            name: "",
            email: "",
          }));
        } else {
          // Use the display_name directly as the single name field
          const displayName = user.display_name || "";

          // Auto-fill the form fields
          setFormData((prev) => ({
            ...prev,
            name: displayName,
            email: user.email || "",
          }));

          setLookupMessage("✅ User Found");
        }
      } else {
        setLookupMessage("❌ Invalid Register Number");
        // Clear name and email for invalid register number
        setFormData((prev) => ({
          ...prev,
          name: "",
          email: "",
        }));
      }
    } catch (error) {
      console.error("Error looking up user:", error);
      setLookupMessage("❌ Invalid Register Number");
      // Clear name and email for invalid register number
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
      }));
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

      if (value && value.trim() !== "") {
        window.registerNumberTimeout = setTimeout(() => {
          lookupUserByRegisterNumber(value);
        }, 500); // Wait 500ms after user stops typing
      } else {
        // Clear name and email when register number is cleared
        setLookupMessage("");
        setFormData((prev) => ({
          ...prev,
          name: "",
          email: "",
        }));
      }
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
    setLookupMessage("");
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

  // Download PDF
  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("http://localhost:8000/teacher/export/pdf");

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teachers-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) => {
    const term = searchTerm.toLowerCase();
    const subjects = [
      teacher.sub_01,
      teacher.sub_02,
      teacher.sub_03,
      teacher.sub_04,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      teacher.name.toLowerCase().includes(term) ||
      teacher.email.toLowerCase().includes(term) ||
      (teacher.registrationNumber &&
        teacher.registrationNumber.toLowerCase().includes(term)) ||
      (teacher.contact && teacher.contact.toLowerCase().includes(term)) ||
      subjects.includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * teachersPerPage,
    currentPage * teachersPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="teacher-management">
      <div className="header">
        <h2>Teacher Management</h2>
        <div className="header-buttons">
          <button className="download-pdf-btn" onClick={handleDownloadPdf}>
            📄 Download PDF Report
          </button>
          <button
            className="add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "Add New Teacher"}
          </button>
        </div>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, teacher ID, contact, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="clear-search-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="search-info">
          Found {filteredTeachers.length} teacher
          {filteredTeachers.length !== 1 ? "s" : ""} matching "{searchTerm}"
        </div>
      )}

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
                  readOnly
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
                  readOnly
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="registrationNumber">
                  Register Number *
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
                  placeholder="e.g. 131594"
                  required
                />
                {lookupMessage && (
                  <div
                    className={`lookup-message ${
                      lookupMessage.includes("✅")
                        ? "success"
                        : lookupMessage.includes("⚠️")
                        ? "warning"
                        : "error"
                    }`}
                  >
                    {lookupMessage}
                  </div>
                )}
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
        ) : filteredTeachers.length === 0 ? (
          <div className="no-data">
            <p>No teachers found matching "{searchTerm}"</p>
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
                {paginatedTeachers.map((teacher) => (
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
                          className="delete-btn1"
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
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 16,
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        margin: "0 4px",
                        padding: "4px 12px",
                        background: page === currentPage ? "#1976d2" : "#fff",
                        color: page === currentPage ? "#fff" : "#1976d2",
                        border: "1px solid #1976d2",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                      disabled={page === currentPage}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
