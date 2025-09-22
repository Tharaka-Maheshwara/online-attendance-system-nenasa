import React, { useState, useEffect } from "react";
import "./StudentManagement.css";
import {
  createStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  lookupStudentByRegisterNumber as lookupStudent,
} from "../../services/studentService";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    registerNumber: "",
    contactNumber: "",
    parentName: "",
    parentEmail: "",
  });
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  // Auto-fill functionality for register number lookup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newStudent.registerNumber && newStudent.registerNumber.length > 2) {
        lookupStudentByRegisterNumber(newStudent.registerNumber);
      } else {
        setLookupMessage("");
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [newStudent.registerNumber]);

  const lookupStudentByRegisterNumber = async (registerNumber) => {
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
          setNewStudent((prev) => ({
            ...prev,
            name: userData.display_name || "",
            email: userData.email || "",
          }));
          setLookupMessage(
            `✅ Found: ${userData.display_name} (${userData.email})`
          );
        } else {
          setLookupMessage("⚠️ Unexpected response format");
        }
      } else if (response.status === 404) {
        setLookupMessage("ℹ️ Register number not found - creating new student");
        // Don't clear existing data, user might be creating a new record
      } else {
        setLookupMessage("⚠️ Error looking up register number");
      }
    } catch (error) {
      console.error("Error looking up student:", error);
      setLookupMessage("⚠️ Error connecting to server");
    } finally {
      setLookupLoading(false);
    }
  };

  const fetchStudents = async () => {
    setFetchingStudents(true);
    setError("");
    try {
      const students = await getAllStudents();
      setStudents(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students. Please try again.");
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create student record using studentService
      await createStudent(newStudent);
      alert("Student created successfully!");

      // Reset form after successful creation
      setNewStudent({
        name: "",
        email: "",
        registerNumber: "",
        contactNumber: "",
        parentName: "",
        parentEmail: "",
      });
      setShowAddForm(false);
      await fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      setError("Error creating student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (student) => {
    if (!student.parentEmail) {
      alert("No parent email found for this student");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/notifications/send-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentName: student.name,
            parentEmail: student.parentEmail,
            classId: 1, // Example class ID
            studentId: student.id,
            isPresent: true,
            date: new Date().toISOString().split("T")[0],
          }),
        }
      );

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

  const handleDelete = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setError("");
      try {
        await deleteStudent(studentId);
        alert("Student deleted successfully!");
        await fetchStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
        setError("Error deleting student: " + error.message);
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent({ ...student });
    setShowAddForm(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateStudent(editingStudent.id, editingStudent);
      alert("Student updated successfully!");
      setEditingStudent(null);
      await fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
      setError("Error updating student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingStudent(null);
  };

  return (
    <div className="student-management">
      <div className="header">
        <h2>Student Management</h2>
        <button
          className="add-btn"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingStudent(null);
          }}
        >
          {showAddForm ? "Cancel" : "Add New Student"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="error-close">
            ×
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="add-student-form">
          <h3>Add New Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={newStudent.email}
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
                    name="registerNumber"
                    value={newStudent.registerNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 131584"
                    required
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
                <label>Contact Number:</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={newStudent.contactNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parent Name:</label>
                <input
                  type="text"
                  name="parentName"
                  value={newStudent.parentName}
                  onChange={handleInputChange}
                  placeholder="Parent/Guardian name"
                />
              </div>
              <div className="form-group">
                <label>Parent Email:</label>
                <input
                  type="email"
                  name="parentEmail"
                  value={newStudent.parentEmail}
                  onChange={handleInputChange}
                  placeholder="Parent email for notifications"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Student"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingStudent && (
        <div className="add-student-form">
          <h3>Edit Student</h3>
          <form onSubmit={handleUpdateSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editingStudent.name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editingStudent.email}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Register Number:</label>
                <input
                  type="text"
                  name="registerNumber"
                  value={editingStudent.registerNumber}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Number:</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={editingStudent.contactNumber || ""}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Parent Name:</label>
                <input
                  type="text"
                  name="parentName"
                  value={editingStudent.parentName || ""}
                  onChange={handleEditInputChange}
                  placeholder="Parent/Guardian name"
                />
              </div>
              <div className="form-group">
                <label>Parent Email:</label>
                <input
                  type="email"
                  name="parentEmail"
                  value={editingStudent.parentEmail || ""}
                  onChange={handleEditInputChange}
                  placeholder="Parent email for notifications"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Student"}
              </button>
              <button type="button" onClick={cancelEdit} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="students-list">
        <h3>Students</h3>
        {fetchingStudents ? (
          <div className="loading-message">Loading students...</div>
        ) : (
          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Register Number</th>
                  <th>Contact</th>
                  <th>Parent Name</th>
                  <th>Parent Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.registerNumber || "N/A"}</td>
                    <td>{student.contactNumber || "N/A"}</td>
                    <td>{student.parentName || "N/A"}</td>
                    <td>{student.parentEmail || "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        {student.parentEmail && (
                          <button
                            className="test-btn"
                            onClick={() => sendTestNotification(student)}
                          >
                            Test Notification
                          </button>
                        )}
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(student.id)}
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

export default StudentManagement;
