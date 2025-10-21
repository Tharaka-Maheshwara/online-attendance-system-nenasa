import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { getAccessToken } from "../../utils/auth";
import "./TeacherLectureNotes.css";

const TeacherLectureNotes = () => {
  const { accounts } = useMsal();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [lectureNote, setLectureNote] = useState({
    title: "",
    description: "",
    file: null,
  });
  const [lectureNotes, setLectureNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch lecture notes for selected class
  const fetchLectureNotes = async (classId) => {
    if (!classId) {
      setLectureNotes([]);
      return;
    }
    try {
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:8000/lecture-notes?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const notes = await response.json();
        setLectureNotes(notes);
      } else {
        setLectureNotes([]);
      }
    } catch (err) {
      console.error("Error fetching lecture notes:", err);
      setLectureNotes([]);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass(selectedClass);
      fetchLectureNotes(selectedClass);
    } else {
      setStudents([]);
      setLectureNotes([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      // Get current teacher's email
      const teacherEmail = accounts[0]?.username || accounts[0]?.name;

      // First, get the teacher info to find their subjects
      const teacherResponse = await fetch(
        `http://localhost:8000/teacher?email=${teacherEmail}`
      );
      if (!teacherResponse.ok) {
        console.error("Failed to fetch teacher info");
        return;
      }

      const teachers = await teacherResponse.json();
      const currentTeacher = teachers.find((t) => t.email === teacherEmail);

      if (!currentTeacher) {
        console.error("Current teacher not found");
        return;
      }

      // Get teacher's subjects
      const teacherSubjects = [
        currentTeacher.sub_01,
        currentTeacher.sub_02,
        currentTeacher.sub_03,
        currentTeacher.sub_04,
      ].filter(Boolean);

      // Fetch all classes
      const response = await fetch("http://localhost:8000/class");
      if (response.ok) {
        const allClasses = await response.json();

        // Filter classes to show only those taught by current teacher
        const teacherClasses = allClasses.filter((cls) =>
          teacherSubjects.some(
            (subject) => subject.toLowerCase() === cls.subject?.toLowerCase()
          )
        );

        setClasses(teacherClasses);
      } else {
        console.error("Failed to fetch classes");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudentsForClass = async (classId) => {
    try {
      setLoading(true);
      const selectedClassInfo = classes.find((c) => c.id === parseInt(classId));
      if (!selectedClassInfo) {
        setStudents([]);
        return;
      }

      const studentsResponse = await fetch("http://localhost:8000/student");
      if (studentsResponse.ok) {
        const allStudents = await studentsResponse.json();

        // Filter students enrolled in the selected class
        const enrolledStudents = allStudents.filter((student) => {
          const studentSubjects = [
            student.sub_1,
            student.sub_2,
            student.sub_3,
            student.sub_4,
            student.sub_5,
            student.sub_6,
          ].filter(Boolean);

          return studentSubjects.some(
            (subject) =>
              subject.toLowerCase() === selectedClassInfo.subject.toLowerCase()
          );
        });

        setStudents(enrolledStudents);
      } else {
        console.error("Failed to fetch students");
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLectureNote((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        setMessage("⚠️ Please select a PDF file only.");
        e.target.value = "";
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage("⚠️ File size should be less than 10MB.");
        e.target.value = "";
        return;
      }

      setLectureNote((prev) => ({
        ...prev,
        file: file,
      }));
      setMessage("");
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();

    if (!selectedClass || !lectureNote.title.trim() || !lectureNote.file) {
      setMessage(
        "⚠️ Please select a class, enter a title, and choose a PDF file."
      );
      return;
    }

    if (students.length === 0) {
      setMessage("⚠️ No students found for the selected class.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = await getAccessToken();
      const teacherEmail = accounts[0]?.username || accounts[0]?.name;

      const formData = new FormData();
      formData.append("classId", selectedClass);
      formData.append("title", lectureNote.title.trim());
      formData.append("description", lectureNote.description.trim());
      formData.append("teacherEmail", teacherEmail);
      formData.append("studentIds", JSON.stringify(students.map((s) => s.id)));
      formData.append("file", lectureNote.file);

      const response = await fetch(
        "http://localhost:8000/lecture-notes/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(
          `✅ Lecture note uploaded successfully and shared with ${students.length} students!`
        );
        setLectureNote({ title: "", description: "", file: null });
        setSelectedClass("");
        setStudents([]);
        // Reset file input
        document.getElementById("file-input").value = "";
      } else {
        setMessage(
          `❌ Failed to upload lecture note: ${
            result.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error uploading lecture note:", error);
      setMessage("❌ Error uploading lecture note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete lecture note handler
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this lecture note?")) {
      return;
    }

    try {
      setLoading(true);
      const token = await getAccessToken();
      const response = await fetch(`http://localhost:8000/lecture-notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessage("✅ Lecture note deleted successfully!");
        // Refresh the lecture notes list
        fetchLectureNotes(selectedClass);
      } else {
        const result = await response.json();
        setMessage(`❌ Failed to delete lecture note: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting lecture note:", error);
      setMessage("❌ Error deleting lecture note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedClassInfo = classes.find(
    (c) => c.id === parseInt(selectedClass)
  );

  return (
    <div className="teacher-lecture-notes">
      <div className="notes-header">
        <h2>📚 Lecture Notes Management</h2>
        <p>Upload and share PDF lecture notes with students in your classes</p>
      </div>

      {message && (
        <div
          className={`message ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <div className="notes-content">
        <div className="upload-form">
          <h3>Upload New Lecture Note</h3>

          <form onSubmit={handleUploadNote}>
            <div className="form-group">
              <label>Select Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">-- Select a Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subject} {cls.code ? `(${cls.code})` : ""}
                    {cls.grade ? ` - Grade ${cls.grade}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="class-info">
                <h4>Class Details:</h4>
                <p>
                  <strong>Subject:</strong> {selectedClassInfo?.subject}
                </p>
                {selectedClassInfo?.grade && (
                  <p>
                    <strong>Grade:</strong> {selectedClassInfo.grade}
                  </p>
                )}
                <p>
                  <strong>Enrolled Students:</strong>{" "}
                  {loading ? "Loading..." : students.length}
                </p>
                {students.length > 0 && (
                  <details className="students-list">
                    <summary>View Students ({students.length})</summary>
                    <ul>
                      {students.map((student) => (
                        <li key={student.id}>
                          {student.name} ({student.email})
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Note Title:</label>
              <input
                type="text"
                name="title"
                value={lectureNote.title}
                onChange={handleInputChange}
                placeholder="e.g., Chapter 5 - Photosynthesis"
                maxLength="100"
                required
              />
              <small>{lectureNote.title.length}/100 characters</small>
            </div>

            <div className="form-group">
              <label>Description (Optional):</label>
              <textarea
                name="description"
                value={lectureNote.description}
                onChange={handleInputChange}
                placeholder="Brief description of the lecture note content..."
                rows="3"
                maxLength="500"
              ></textarea>
              <small>{lectureNote.description.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label>PDF File:</label>
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              <small>Only PDF files are allowed. Maximum file size: 10MB</small>
            </div>

            <button
              type="submit"
              className="upload-btn"
              disabled={
                loading ||
                !selectedClass ||
                !lectureNote.title.trim() ||
                !lectureNote.file
              }
            >
              {loading ? "📤 Uploading..." : "📚 Upload Lecture Note"}
            </button>
          </form>
        </div>

        {/* Display existing lecture notes for the selected class */}
        {selectedClass && lectureNotes.length > 0 && (
          <div className="lecture-notes-list">
            <h3>📄 Existing Lecture Notes</h3>
            <div className="notes-grid">
              {lectureNotes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <h4 className="note-title">{note.title}</h4>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete this lecture note"
                    >
                      🗑️
                    </button>
                  </div>
                  {note.description && (
                    <p className="note-description">{note.description}</p>
                  )}
                  <div className="note-meta">
                    <span className="note-date">
                      📅 {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <span className="note-size">
                      📎 {note.fileName}
                    </span>
                  </div>
                  <div className="note-actions">
                    <button
                      className="download-btn"
                      onClick={() => window.open(`http://localhost:8000/lecture-notes/download/${note.id}`, '_blank')}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLectureNotes;
