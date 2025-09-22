import React, { useState, useEffect } from "react";
import "./StudentManagement.css";
import {
  createStudent,
  getAllStudents,
  deleteStudent,
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

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
    try {
      const students = await getAllStudents();
      setStudents(students);
    } catch (error) {
      console.error("Error fetching students:", error);
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
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Error creating student: " + error.message);
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
      try {
        await deleteStudent(studentId);
        alert("Student deleted successfully!");
        fetchStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("Error deleting student: " + error.message);
      }
    }
  };

  return (
    <div className="student-management">
      <div className="header">
        <h2>Student Management</h2>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New Student"}
        </button>
      </div>

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

      <div className="students-list">
        <h3>Students</h3>
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
      </div>
    </div>
  );
};

export default StudentManagement;
