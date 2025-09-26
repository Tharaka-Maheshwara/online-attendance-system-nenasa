import React, { useState, useEffect } from "react";
import "./StudentManagement.css";
import {
  createStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,
  lookupStudentByRegisterNumber as lookupStudent,
} from "../../services/studentService";
import { getAllClasses } from "../../services/classService";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    registerNumber: "",
    contactNumber: "",
    parentName: "",
    parentEmail: "",
    sub_1: "",
    sub_2: "",
    sub_3: "",
    sub_4: "",
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
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const classData = await getAllClasses();
      setClasses(classData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

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

  const validateSubjects = (studentData) => {
    const subjects = [
      studentData.sub_1,
      studentData.sub_2,
      studentData.sub_3,
      studentData.sub_4,
    ].filter((subject) => subject && subject !== "");

    const uniqueSubjects = [...new Set(subjects)];
    if (subjects.length !== uniqueSubjects.length) {
      throw new Error("Duplicate subject assignments are not allowed");
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
      // Validate subjects before submission
      validateSubjects(newStudent);

      // Filter out empty subject names
      const studentData = {
        ...newStudent,
        sub_1: newStudent.sub_1 || null,
        sub_2: newStudent.sub_2 || null,
        sub_3: newStudent.sub_3 || null,
        sub_4: newStudent.sub_4 || null,
      };

      // Create student record using studentService
      await createStudent(studentData);
      alert("Student created successfully!");

      // Reset form after successful creation
      setNewStudent({
        name: "",
        email: "",
        registerNumber: "",
        contactNumber: "",
        parentName: "",
        parentEmail: "",
        sub_1: "",
        sub_2: "",
        sub_3: "",
        sub_4: "",
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
      // Validate subjects before submission
      validateSubjects(editingStudent);

      // Filter out empty subject names
      const studentData = {
        ...editingStudent,
        sub_1: editingStudent.sub_1 || null,
        sub_2: editingStudent.sub_2 || null,
        sub_3: editingStudent.sub_3 || null,
        sub_4: editingStudent.sub_4 || null,
      };

      await updateStudent(editingStudent.id, studentData);
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

            <div className="subjects-section">
              <h4>Subject Assignment (Maximum 4 subjects)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 1:</label>
                  <select
                    name="sub_1"
                    value={newStudent.sub_1}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 2:</label>
                  <select
                    name="sub_2"
                    value={newStudent.sub_2}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 3:</label>
                  <select
                    name="sub_3"
                    value={newStudent.sub_3}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 4:</label>
                  <select
                    name="sub_4"
                    value={newStudent.sub_4}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
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

            <div className="subjects-section">
              <h4>Subject Assignment (Maximum 4 subjects)</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 1:</label>
                  <select
                    name="sub_1"
                    value={editingStudent.sub_1 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 2:</label>
                  <select
                    name="sub_2"
                    value={editingStudent.sub_2 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 3:</label>
                  <select
                    name="sub_3"
                    value={editingStudent.sub_3 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 4:</label>
                  <select
                    name="sub_4"
                    value={editingStudent.sub_4 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name} {cls.subject ? `- ${cls.subject}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <th>Subjects</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const subjects = [
                    student.sub_1,
                    student.sub_2,
                    student.sub_3,
                    student.sub_4,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.registerNumber || "N/A"}</td>
                      <td>{student.contactNumber || "N/A"}</td>
                      <td>{student.parentName || "N/A"}</td>
                      <td>{student.parentEmail || "N/A"}</td>
                      <td>{subjects || "No subjects assigned"}</td>
                      <td>
                        <div className="action-buttons">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
