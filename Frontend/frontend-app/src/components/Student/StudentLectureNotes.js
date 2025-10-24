import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "../Dashboard/StudentDashboard.css"; // Reuse styles from StudentDashboard
import "./StudentLectureNotes.css"; // Custom styles for lecture notes

const StudentLectureNotes = () => {
  const { accounts } = useMsal();
  const [lectureNotes, setLectureNotes] = useState([]);
  const [lectureNotesLoading, setLectureNotesLoading] = useState(true);

  useEffect(() => {
    const fetchLectureNotes = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLectureNotesLoading(true);
        const userEmail = accounts[0].username;

        const lectureNotesResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/lecture-notes`
        );

        if (lectureNotesResponse.ok) {
          const lectureNotesData = await lectureNotesResponse.json();
          setLectureNotes(lectureNotesData);
        } else {
          console.error("Failed to fetch lecture notes");
          setLectureNotes([]);
        }
      } catch (error) {
        console.error("Error fetching lecture notes:", error);
        setLectureNotes([]);
      } finally {
        setLectureNotesLoading(false);
      }
    };

    fetchLectureNotes();
  }, [accounts]);

  const formatAnnouncementDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatAnnouncementTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownloadNote = async (noteId, fileName) => {
    try {
      const response = await fetch(
        `http://localhost:8000/lecture-notes/download/${noteId}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to download lecture note");
        alert("Failed to download the file. Please try again.");
      }
    } catch (error) {
      console.error("Error downloading lecture note:", error);
      alert("Error downloading the file. Please try again.");
    }
  };

  return (
    <div className="student-dashboard">
      <div className="lecture-notes-section">
        <h2>Class Lecture Notes</h2>
        <div className="lecture-notes-content">
          {lectureNotesLoading ? (
            <div className="loading-message">Loading lecture notes...</div>
          ) : lectureNotes.length > 0 ? (
            <div className="lecture-notes-grid">
              {lectureNotes.map((note) => (
                <div key={note.id} className="lecture-note-compact-card">
                  <div className="note-card-header">
                    <div className="file-icon">📄</div>
                    <div className="note-info">
                      <h4 className="note-title">{note.title}</h4>
                      <span className="note-subject">
                        {note.classInfo?.subject || "Unknown Subject"}
                      </span>
                    </div>
                    <span className="note-time">
                      {formatAnnouncementDate(note.createdAt)}
                    </span>
                  </div>

                  <div className="note-card-body">
                    <div className="class-meta">
                      <span className="grade-tag">
                        Grade {note.classInfo?.grade || "N/A"}
                      </span>
                      <span className="teacher-name">
                        👨‍🏫 {note.classInfo?.teacherName || "Unknown Teacher"}
                      </span>
                    </div>

                    <div className="file-details">
                      <span className="file-name">{note.fileName}</span>
                      <span className="file-size">
                        {formatFileSize(note.fileSize)}
                      </span>
                    </div>
                  </div>

                  <div className="note-card-footer">
                    <button
                      className="download-btn-compact"
                      onClick={() => handleDownloadNote(note.id, note.fileName)}
                    >
                      ⬇️ Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-lecture-notes-message">
              <p>📚 No lecture notes available!</p>
              <span>
                Your teachers will share study materials and lecture notes here.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLectureNotes;
