import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useSocket } from "../../contexts/SocketContext";
import "../Dashboard/StudentDashboard.css"; // Reuse styles from StudentDashboard
import "./StudentAnnouncements.css"; // Custom styles for announcements

const StudentAnnouncements = () => {
  const { accounts } = useMsal();
  const { socket, addNotification } = useSocket();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [newNotification, setNewNotification] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setAnnouncementsLoading(true);
        const userEmail = accounts[0].username;

        const announcementsResponse = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/announcements`
        );

        if (announcementsResponse.ok) {
          const announcementsData = await announcementsResponse.json();
          setAnnouncements(announcementsData);
          setFilteredAnnouncements(announcementsData);

          // Extract unique subjects for filter
          const subjects = [
            ...new Set(
              announcementsData.map(
                (announcement) =>
                  announcement.classInfo?.subject || "Unknown Subject"
              )
            ),
          ].sort();
          setAvailableSubjects(subjects);
        } else {
          console.error("Failed to fetch announcements");
          setAnnouncements([]);
          setFilteredAnnouncements([]);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
        setFilteredAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [accounts]);

  // Listen for real-time announcement updates
  useEffect(() => {
    if (!socket) return;

    const handleNewAnnouncement = (data) => {
      console.log("📢 New announcement received:", data);

      // Show notification
      setNewNotification({
        id: Date.now(),
        type: "announcement",
        title: "New Announcement",
        message: data.message,
        data: data.data,
      });

      // Add to notifications
      addNotification({
        id: Date.now(),
        type: "announcement",
        title: "New Announcement",
        message: data.message,
        timestamp: data.timestamp,
      });

      // Refresh announcements list
      if (accounts && accounts.length > 0) {
        const userEmail = accounts[0].username;
        fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(
            userEmail
          )}/announcements`
        )
          .then((res) => res.json())
          .then((updatedAnnouncements) => {
            setAnnouncements(updatedAnnouncements);
            if (selectedSubject === "All") {
              setFilteredAnnouncements(updatedAnnouncements);
            }
          })
          .catch((error) =>
            console.error("Error refreshing announcements:", error)
          );
      }

      // Auto hide notification after 5 seconds
      setTimeout(() => {
        setNewNotification(null);
      }, 5000);
    };

    socket.on("newAnnouncement", handleNewAnnouncement);

    return () => {
      socket.off("newAnnouncement", handleNewAnnouncement);
    };
  }, [socket, accounts, selectedSubject, addNotification]);

  // Filter announcements when selected subject changes
  useEffect(() => {
    if (selectedSubject === "All") {
      setFilteredAnnouncements(announcements);
    } else {
      const filtered = announcements.filter(
        (announcement) =>
          (announcement.classInfo?.subject || "Unknown Subject") ===
          selectedSubject
      );
      setFilteredAnnouncements(filtered);
    }
  }, [selectedSubject, announcements]);

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  const getPriorityText = (priority) => {
    const priorityTexts = {
      low: "Low",
      normal: "Normal",
      high: "High",
    };
    return priorityTexts[priority] || "Normal";
  };

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

  return (
    <div className="student-dashboard">
      {/* Real-time notification toast */}
      {newNotification && (
        <div className="notification-toast announcement-toast">
          <div className="toast-icon">📢</div>
          <div className="toast-content">
            <h4>{newNotification.title}</h4>
            <p>{newNotification.message}</p>
          </div>
          <button
            className="toast-close"
            onClick={() => setNewNotification(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="announcements-section">
        <div className="announcements-header">
          <h2>Class Announcements</h2>
          <div className="filter-section">
            <label htmlFor="subject-filter" className="filter-label">
              📚 Filter by Subject:
            </label>
            <select
              id="subject-filter"
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="subject-filter-dropdown"
            >
              <option value="All">All Subjects</option>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="announcements-content">
          {announcementsLoading ? (
            <div className="loading-message">Loading announcements...</div>
          ) : filteredAnnouncements.length > 0 ? (
            <div className="announcements-grid">
              {filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="announcement-compact-card"
                >
                  <div className="announcement-card-header">
                    <div className="announcement-icon">📢</div>
                    <div className="announcement-info">
                      <h4 className="announcement-title">
                        {announcement.title}
                      </h4>
                      <span className="announcement-subject">
                        {announcement.classInfo?.subject || "Unknown Subject"}
                      </span>
                    </div>
                    <span className="announcement-date">
                      {formatAnnouncementDate(announcement.createdAt)}
                    </span>
                  </div>

                  <div className="announcement-card-body">
                    <div className="announcement-meta">
                      <span
                        className={`announcement-priority ${announcement.priority}`}
                      >
                        {getPriorityText(announcement.priority)}
                      </span>
                      <span className="grade-tag">
                        Grade {announcement.classInfo?.grade || "N/A"}
                      </span>
                      <span className="teacher-name">
                        👨‍🏫{" "}
                        {announcement.classInfo?.teacherName ||
                          "Unknown Teacher"}
                      </span>
                    </div>

                    <div className="announcement-message-box">
                      <p>{announcement.message}</p>
                    </div>
                  </div>

                  <div className="announcement-card-footer">
                    <small className="announcement-time">
                      {formatAnnouncementTime(announcement.createdAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-announcements-message">
              {selectedSubject === "All" ? (
                <>
                  <p>📢 No announcements yet!</p>
                  <span>
                    Your teachers will post important updates and announcements
                    here.
                  </span>
                </>
              ) : (
                <>
                  <p>📢 No announcements found for {selectedSubject}!</p>
                  <span>
                    Try selecting a different subject or check back later.
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnnouncements;
