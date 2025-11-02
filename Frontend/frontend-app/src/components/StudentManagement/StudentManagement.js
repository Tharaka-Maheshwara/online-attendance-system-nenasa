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
import QRCode from "react-qr-code";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [editFilteredClasses, setEditFilteredClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    registerNumber: "",
    contactNumber: "",
    parentName: "",
    parentEmail: "",
    gender: "",
    grade: "",
    sub_1: "",
    sub_2: "",
    sub_3: "",
    sub_4: "",
    sub_5: "",
    sub_6: "",
    profileImage: null, // For storing the selected file
  });
  const [editingStudent, setEditingStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [error, setError] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudentQR, setSelectedStudentQR] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

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
      studentData.sub_5,
      studentData.sub_6,
    ].filter((subject) => subject && subject !== "");

    const uniqueSubjects = [...new Set(subjects)];
    if (subjects.length !== uniqueSubjects.length) {
      throw new Error("Duplicate subject assignments are not allowed");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("http://localhost:8000/student/export/pdf");
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-list-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError("Failed to download PDF. Please try again.");
    }
  };

  const filterClassesByGrade = (selectedGrade) => {
    if (!selectedGrade) {
      setFilteredClasses([]);
      return;
    }

    const gradeNumber = parseInt(selectedGrade);
    const matchingClasses = classes.filter(
      (cls) =>
        cls.grade === gradeNumber ||
        cls.grade === null ||
        cls.grade === undefined
    );
    setFilteredClasses(matchingClasses);
  };

  const filterEditClassesByGrade = (selectedGrade) => {
    if (!selectedGrade) {
      setEditFilteredClasses([]);
      return;
    }

    const gradeNumber = parseInt(selectedGrade);
    const matchingClasses = classes.filter(
      (cls) =>
        cls.grade === gradeNumber ||
        cls.grade === null ||
        cls.grade === undefined
    );
    setEditFilteredClasses(matchingClasses);
  };

  // Function to get available subjects for a specific dropdown (excluding already selected)
  const getAvailableSubjects = (currentSubjectField, isEditMode = false) => {
    const sourceClasses = isEditMode ? editFilteredClasses : filteredClasses;
    const studentData = isEditMode ? editingStudent : newStudent;

    // Get all currently selected subjects except the current field
    const selectedSubjects = [
      studentData.sub_1,
      studentData.sub_2,
      studentData.sub_3,
      studentData.sub_4,
      studentData.sub_5,
      studentData.sub_6,
    ].filter((subject, index) => {
      const fieldNames = ["sub_1", "sub_2", "sub_3", "sub_4", "sub_5", "sub_6"];
      return (
        subject && subject !== "" && fieldNames[index] !== currentSubjectField
      );
    });

    // Filter out already selected subjects
    return sourceClasses.filter(
      (cls) => !selectedSubjects.includes(cls.subject)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Filter classes when grade changes
    if (name === "grade") {
      filterClassesByGrade(value);
      // Clear existing subject selections when grade changes
      setNewStudent((prev) => ({
        ...prev,
        grade: value,
        sub_1: "",
        sub_2: "",
        sub_3: "",
        sub_4: "",
        sub_5: "",
        sub_6: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, or GIF)");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setNewStudent((prev) => ({
        ...prev,
        profileImage: file,
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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
        sub_5: newStudent.sub_5 || null,
        sub_6: newStudent.sub_6 || null,
      };

      // Create student record using studentService
      const createdStudent = await createStudent(studentData);
      console.log("Created Student:", createdStudent); // <-- Add this line
      alert("Student created successfully!");

      // Add the new student to the list
      setStudents((prevStudents) => [createdStudent, ...prevStudents]);

      // Reset form after successful creation
      setNewStudent({
        name: "",
        email: "",
        registerNumber: "",
        contactNumber: "",
        parentName: "",
        parentEmail: "",
        gender: "",
        grade: "",
        sub_1: "",
        sub_2: "",
        sub_3: "",
        sub_4: "",
        sub_5: "",
        sub_6: "",
        profileImage: null,
      });
      setImagePreview(null);
      setShowAddForm(false);
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

    // Filter classes based on student's grade when editing
    if (student.grade) {
      filterEditClassesByGrade(student.grade.toString());
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Filter classes when grade changes in edit mode
    if (name === "grade") {
      filterEditClassesByGrade(value);
      // Clear existing subject selections when grade changes
      setEditingStudent((prev) => ({
        ...prev,
        grade: value,
        sub_1: "",
        sub_2: "",
        sub_3: "",
        sub_4: "",
        sub_5: "",
        sub_6: "",
      }));
    }
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
        sub_5: editingStudent.sub_5 || null,
        sub_6: editingStudent.sub_6 || null,
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

  const handleShowQR = (student) => {
    setSelectedStudentQR(student);
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
    setSelectedStudentQR(null);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("QRCode");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedStudentQR.name}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    const subjects = [
      student.sub_1,
      student.sub_2,
      student.sub_3,
      student.sub_4,
      student.sub_5,
      student.sub_6,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      (student.registerNumber &&
        student.registerNumber.toLowerCase().includes(term)) ||
      (student.grade && student.grade.toString().includes(term)) ||
      (student.contactNumber &&
        student.contactNumber.toLowerCase().includes(term)) ||
      (student.parentName && student.parentName.toLowerCase().includes(term)) ||
      (student.parentEmail &&
        student.parentEmail.toLowerCase().includes(term)) ||
      subjects.includes(term)
    );
  });

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="student-management">
      <div className="header">
        <h2>Student Management</h2>
        <div className="header-buttons">
          <button className="download-pdf-btn" onClick={handleDownloadPdf}>
            📄 Download PDF
          </button>
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
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError("")} className="error-close">
            ×
          </button>
        </div>
      )}

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, register number, grade, contact, parent, or subject..."
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
          Found {filteredStudents.length} student
          {filteredStudents.length !== 1 ? "s" : ""} matching "{searchTerm}"
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
                  readOnly
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
                  readOnly
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
                <label>Gender:</label>
                <select
                  name="gender"
                  value={newStudent.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Grade:</label>
                <select
                  name="grade"
                  value={newStudent.grade}
                  onChange={handleInputChange}
                  required
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
                    <span>📷 Choose student photo (Max 5MB)</span>
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
                        setNewStudent((prev) => ({
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

            <div className="subjects-section">
              <h4>Subject Assignment</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 1:</label>
                  <select
                    name="sub_1"
                    value={newStudent.sub_1}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_1", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_2", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_3", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_4", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 5:</label>
                  <select
                    name="sub_5"
                    value={newStudent.sub_5}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_5", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 6:</label>
                  <select
                    name="sub_6"
                    value={newStudent.sub_6}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_6", false).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!newStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                <label>Gender:</label>
                <select
                  name="gender"
                  value={editingStudent.gender || ""}
                  onChange={handleEditInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Grade:</label>
                <select
                  name="grade"
                  value={editingStudent.grade || ""}
                  onChange={handleEditInputChange}
                  required
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
              <h4>Subject Assignment</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 1:</label>
                  <select
                    name="sub_1"
                    value={editingStudent.sub_1 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_1", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_2", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_3", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                    {getAvailableSubjects("sub_4", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject 5:</label>
                  <select
                    name="sub_5"
                    value={editingStudent.sub_5 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_5", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject 6:</label>
                  <select
                    name="sub_6"
                    value={editingStudent.sub_6 || ""}
                    onChange={handleEditInputChange}
                  >
                    <option value="">Select Subject</option>
                    {getAvailableSubjects("sub_6", true).map((cls) => (
                      <option key={cls.id} value={cls.subject}>
                        {cls.subject}
                      </option>
                    ))}
                    {!editingStudent.grade && (
                      <option disabled>Please select grade first</option>
                    )}
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
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Register Number</th>
                  <th>Contact</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      {searchTerm
                        ? `No students found matching "${searchTerm}"`
                        : "No students available"}
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                    const subjects = [
                      student.sub_1,
                      student.sub_2,
                      student.sub_3,
                      student.sub_4,
                      student.sub_5,
                      student.sub_6,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr key={student.id}>
                        <td>
                          {student.profileImage ? (
                            <img
                              src={`http://localhost:8000${student.profileImage}`}
                              alt={student.name}
                              className="student-image"
                              style={{
                                width: 56,
                                height: 56,
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                            />
                          ) : (
                            <div
                              className="student-image-placeholder"
                              style={{
                                width: 56,
                                height: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 32,
                              }}
                            >
                              👤
                            </div>
                          )}
                        </td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.registerNumber || "N/A"}</td>
                        <td>{student.contactNumber || "N/A"}</td>
                        <td>
                          {student.grade ? `Grade ${student.grade}` : "N/A"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(student)}
                            >
                              Edit
                            </button>
                            <button
                              className="qr-btn"
                              onClick={() => handleShowQR(student)}
                            >
                              QR Code
                            </button>
                            <button
                              className="delete-btn2"
                              onClick={() => handleDelete(student.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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

      {/* QR Code Modal */}
      {showQRModal && selectedStudentQR && (
        <div className="qr-modal-overlay" onClick={handleCloseQR}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>QR Code - {selectedStudentQR.name}</h3>
              <button className="close-btn" onClick={handleCloseQR}>
                ×
              </button>
            </div>
            <div className="qr-modal-content">
              <div className="student-info">
                <p>
                  <strong>Name:</strong> {selectedStudentQR.name}
                </p>
                <p>
                  <strong>Register Number:</strong>{" "}
                  {selectedStudentQR.registerNumber}
                </p>
                <p>
                  <strong>Email:</strong> {selectedStudentQR.email}
                </p>
              </div>
              <div className="qr-code-container">
                <QRCode
                  id="QRCode"
                  value={JSON.stringify({
                    type: "student_attendance",
                    studentId: selectedStudentQR.id,
                    name: selectedStudentQR.name,
                    registerNumber: selectedStudentQR.registerNumber,
                  })}
                  size={256}
                  level={"H"}
                  includeMargin={true}
                />
                <div className="qr-actions">
                  <button className="download-btn" onClick={downloadQRCode}>
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
