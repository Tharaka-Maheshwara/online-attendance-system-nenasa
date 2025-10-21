import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { getAccessToken } from "../../utils/auth";
import "./TeacherAnnouncements.css";

const TeacherAnnouncements = () => {
  const { accounts } = useMsal();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    priority: "normal",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sentAnnouncements, setSentAnnouncements] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSentAnnouncements();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      // Get current teacher's email
      const teacherEmail = accounts[0]?.username || accounts[0]?.name;
      
      // First, get the teacher info to find their subjects
      const teacherResponse = await fetch(`http://localhost:8000/teacher?email=${teacherEmail}`);
      if (!teacherResponse.ok) {
        console.error("Failed to fetch teacher info");
        return;
      }
      
      const teachers = await teacherResponse.json();
      const currentTeacher = teachers.find(t => t.email === teacherEmail);
      
      if (!currentTeacher) {
        console.error("Current teacher not found");
        return;
      }
      
      // Get teacher's subjects
      const teacherSubjects = [
        currentTeacher.sub_01,
        currentTeacher.sub_02,
        currentTeacher.sub_03,
        currentTeacher.sub_04
      ].filter(Boolean);
      
      // Fetch all classes
      const response = await fetch("http://localhost:8000/class");
      if (response.ok) {
        const allClasses = await response.json();
        
        // Filter classes to show only those taught by current teacher
        const teacherClasses = allClasses.filter(cls => 
          teacherSubjects.some(subject => 
            subject.toLowerCase() === cls.subject?.toLowerCase()
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

  const fetchSentAnnouncements = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        "http://localhost:8000/announcements/teacher",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const announcements = await response.json();
        setSentAnnouncements(announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();

    if (
      !selectedClass ||
      !announcement.title.trim() ||
      !announcement.message.trim()
    ) {
      setMessage("⚠️ Please select a class and fill in all fields.");
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

      const announcementData = {
        classId: parseInt(selectedClass),
        title: announcement.title.trim(),
        message: announcement.message.trim(),
        priority: announcement.priority,
        teacherEmail: teacherEmail,
        studentIds: students.map((student) => student.id),
      };

      const response = await fetch("http://localhost:8000/announcements/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(announcementData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(
          `✅ Announcement sent successfully to ${students.length} students!`
        );
        setAnnouncement({ title: "", message: "", priority: "normal" });
        setSelectedClass("");
        setStudents([]);
        fetchSentAnnouncements(); // Refresh sent announcements
      } else {
        setMessage(
          `❌ Failed to send announcement: ${result.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      setMessage("❌ Error sending announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedClassInfo = classes.find(
    (c) => c.id === parseInt(selectedClass)
  );

  return (
    <div className="teacher-announcements">
      <div className="announcements-header">
        <h2>📢 Class Announcements</h2>
        <p>Send announcements to students enrolled in your classes</p>
      </div>

      {message && (
        <div
          className={`message ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <div className="announcements-content">
        <div className="announcement-form">
          <h3>Create New Announcement</h3>

          <form onSubmit={handleSendAnnouncement}>
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
              <label>Announcement Title:</label>
              <input
                type="text"
                name="title"
                value={announcement.title}
                onChange={handleInputChange}
                placeholder="Enter announcement title..."
                maxLength="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Priority Level:</label>
              <select
                name="priority"
                value={announcement.priority}
                onChange={handleInputChange}
              >
                <option value="low">🟢 Low Priority</option>
                <option value="normal">🟡 Normal Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label>Announcement Message:</label>
              <textarea
                name="message"
                value={announcement.message}
                onChange={handleInputChange}
                placeholder="Enter your announcement message..."
                rows="6"
                maxLength="1000"
                required
              ></textarea>
              <small>{announcement.message.length}/1000 characters</small>
            </div>

            <button
              type="submit"
              className="send-btn"
              disabled={
                loading ||
                !selectedClass ||
                !announcement.title.trim() ||
                !announcement.message.trim()
              }
            >
              {loading ? "📤 Sending..." : "📢 Send Announcement"}
            </button>
          </form>
        </div>

        <div className="sent-announcements">
          <h3>Recent Announcements</h3>
          {sentAnnouncements.length > 0 ? (
            <div className="announcements-list">
              {sentAnnouncements.slice(0, 5).map((announce) => (
                <div key={announce.id} className="announcement-card">
                  <div className="announcement-header">
                    <h4>{announce.title}</h4>
                    <span className={`priority ${announce.priority}`}>
                      {announce.priority === "high" && "🔴"}
                      {announce.priority === "normal" && "🟡"}
                      {announce.priority === "low" && "🟢"}
                      {announce.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="announcement-message">{announce.message}</p>
                  <div className="announcement-meta">
                    <span>
                      📅 {new Date(announce.createdAt).toLocaleDateString()}
                    </span>
                    <span>👥 {announce.recipientCount || 0} students</span>
                    <span>📚 {announce.className}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-announcements">
              <p>No announcements sent yet.</p>
              <p>Select a class and create your first announcement!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAnnouncements;
