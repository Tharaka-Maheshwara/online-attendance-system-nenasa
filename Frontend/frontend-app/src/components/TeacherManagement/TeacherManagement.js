import React, { useState, useEffect } from "react";
import "./TeacherManagement.css";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    registrationNumber: "",
    contact: "",
    address: "",
    emergencyContact: "",
    subject: "",
    qualification: "",
    experience: "",
    classesAssigned: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Mock teacher creation - replace with actual API call
      console.log("Creating teacher with data:", formData);

      // Reset form after successful submission
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        registrationNumber: "",
        contact: "",
        address: "",
        emergencyContact: "",
        subject: "",
        qualification: "",
        experience: "",
        classesAssigned: "",
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
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      registrationNumber: "",
      contact: "",
      address: "",
      emergencyContact: "",
      subject: "",
      qualification: "",
      experience: "",
      classesAssigned: "",
    });
    setShowAddForm(false);
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
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label htmlFor="registrationNumber">Teacher ID *</label>
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
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="tel"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subject">Subject/Department *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Mathematics, Science"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="qualification">Qualification</label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., B.Sc., M.Ed."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="experience">Years of Experience</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="classesAssigned">Classes Assigned</label>
                <input
                  type="text"
                  id="classesAssigned"
                  name="classesAssigned"
                  value={formData.classesAssigned}
                  onChange={handleInputChange}
                  placeholder="e.g., Grade 10A, Grade 11B"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
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
                  <th>Subject</th>
                  <th>Contact</th>
                  <th>Classes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.registrationNumber}</td>
                    <td>
                      {teacher.firstName} {teacher.lastName}
                    </td>
                    <td>{teacher.email}</td>
                    <td>{teacher.subject}</td>
                    <td>{teacher.contact}</td>
                    <td>{teacher.classesAssigned || "-"}</td>
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
