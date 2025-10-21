import React, { useState, useEffect } from "react";
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
} from "../../services/classService";
import { getAllTeachers } from "../../services/teacherService";
import "./ClassManagement.css";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    teacherId: "",
    grade: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  // Subject details modal state
  const [showSubjectDetails, setShowSubjectDetails] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectTeacher, setSubjectTeacher] = useState(null);
  const [subjectStudents, setSubjectStudents] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error loading classes:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Filter teachers when subject changes
    if (name === "subject" && value.trim() !== "") {
      const matchingTeachers = teachers.filter((teacher) =>
        [teacher.sub_01, teacher.sub_02, teacher.sub_03, teacher.sub_04]
          .filter(Boolean)
          .some((subject) =>
            subject.toLowerCase().includes(value.toLowerCase())
          )
      );
      setFilteredTeachers(matchingTeachers);
    } else if (name === "subject") {
      setFilteredTeachers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateClass(currentClass.id, formData);
        alert("Class updated successfully!");
      } else {
        await createClass(formData);
        alert("Class created successfully!");
      }
      resetForm();
      loadClasses();
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Failed to save class.");
    }
  };

  const handleEdit = (cls) => {
    setIsEditing(true);
    setCurrentClass(cls);
    setFormData({
      subject: cls.subject || "",
      teacherId: cls.teacherId || "",
      grade: cls.grade || "",
      dayOfWeek: cls.dayOfWeek || "",
      startTime: cls.startTime || "",
      endTime: cls.endTime || "",
    });

    // Filter teachers if subject exists
    if (cls.subject) {
      const matchingTeachers = teachers.filter((teacher) =>
        [teacher.sub_01, teacher.sub_02, teacher.sub_03, teacher.sub_04]
          .filter(Boolean)
          .some((subject) =>
            subject.toLowerCase().includes(cls.subject.toLowerCase())
          )
      );
      setFilteredTeachers(matchingTeachers);
    }

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteClass(id);
        alert("Class deleted successfully!");
        loadClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        alert("Failed to delete class.");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentClass(null);
    setFormData({
      subject: "",
      teacherId: "",
      grade: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    });
    setFilteredTeachers([]);
  };

  // Function to fetch teacher who teaches the subject
  const fetchTeacherForSubject = async (subjectName) => {
    try {
      const response = await fetch("http://localhost:8000/teacher");
      const teachers = await response.json();

      // Find teacher who teaches this subject
      const teacher = teachers.find(
        (t) =>
          t.sub_01 === subjectName ||
          t.sub_02 === subjectName ||
          t.sub_03 === subjectName ||
          t.sub_04 === subjectName
      );

      return teacher || null;
    } catch (error) {
      console.error("Error fetching teacher for subject:", error);
      return null;
    }
  };

  // Function to fetch students enrolled in the subject
  const fetchStudentsForSubject = async (subjectName) => {
    try {
      const response = await fetch("http://localhost:8000/student");
      const students = await response.json();

      // Filter students who are enrolled in this subject
      const enrolledStudents = students.filter(
        (s) =>
          s.sub_1 === subjectName ||
          s.sub_2 === subjectName ||
          s.sub_3 === subjectName ||
          s.sub_4 === subjectName
      );

      return enrolledStudents;
    } catch (error) {
      console.error("Error fetching students for subject:", error);
      return [];
    }
  };

  // Handle subject click
  const handleSubjectClick = async (subjectName) => {
    setLoadingDetails(true);
    setSelectedSubject(subjectName);
    setShowSubjectDetails(true);

    try {
      // Fetch teacher and students concurrently
      const [teacher, students] = await Promise.all([
        fetchTeacherForSubject(subjectName),
        fetchStudentsForSubject(subjectName),
      ]);

      setSubjectTeacher(teacher);
      setSubjectStudents(students);
    } catch (error) {
      console.error("Error fetching subject details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Close subject details modal
  const closeSubjectDetails = () => {
    setShowSubjectDetails(false);
    setSelectedSubject(null);
    setSubjectTeacher(null);
    setSubjectStudents([]);
  };

  return (
    <div className="class-management">
      <div className="header">
        <h2>Class Management</h2>
        <button
          className="add-btn"
          onClick={() => {
            setShowForm(true);
            setIsEditing(false);
          }}
        >
          Add New Class
        </button>
      </div>

      {showForm && (
        <div className="class-form-container">
          <h3>{isEditing ? "Edit Class" : "Add New Class"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Teacher</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
                {formData.subject && filteredTeachers.length === 0 && (
                  <small style={{ color: "#666", fontSize: "12px" }}>
                    No teachers found for this subject
                  </small>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Grade</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                >
                  <option value="">Select Grade</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="13">Grade 13</option>
                </select>
              </div>
              <div className="form-group">
                <label>Day of Week</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                >
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subject Details Modal */}
      {showSubjectDetails && (
        <div className="modal-overlay" onClick={closeSubjectDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Subject Details: {selectedSubject}</h3>
              <button className="close-btn" onClick={closeSubjectDetails}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <div className="loading">Loading subject details...</div>
              ) : (
                <>
                  {/* Teacher Information */}
                  <div className="detail-section">
                    <h4>👨‍🏫 Teacher</h4>
                    {subjectTeacher ? (
                      <div className="teacher-info">
                        <p>
                          <strong>Name:</strong> {subjectTeacher.name}
                        </p>
                        <p>
                          <strong>Register Number:</strong>{" "}
                          {subjectTeacher.registerNumber}
                        </p>
                      </div>
                    ) : (
                      <p className="no-data">
                        No teacher assigned to this subject
                      </p>
                    )}
                  </div>

                  {/* Student Information */}
                  <div className="detail-section">
                    <h4>👥 Students ({subjectStudents.length})</h4>
                    {subjectStudents.length > 0 ? (
                      <div className="students-list">
                        <div className="students-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Register No.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subjectStudents.map((student) => (
                                <tr key={student.id}>
                                  <td>{student.name}</td>
                                  <td>{student.registerNumber}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="no-data">
                        No students enrolled in this subject
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeSubjectDetails}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="classes-list">
        <h3>Available Classes</h3>
        <div className="classes-table">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Day of Week</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>
                    <span
                      className="clickable-subject"
                      onClick={() => handleSubjectClick(cls.subject)}
                      style={{ cursor: "pointer" }}
                    >
                      {cls.subject}
                    </span>
                  </td>
                  <td>{cls.dayOfWeek || "-"}</td>
                  <td>{cls.startTime || "-"}</td>
                  <td>{cls.endTime || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(cls)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn4"
                        onClick={() => handleDelete(cls.id)}
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

export default ClassManagement;
