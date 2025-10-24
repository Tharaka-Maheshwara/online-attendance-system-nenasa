import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "../Dashboard/StudentDashboard.css"; // Reuse styles from StudentDashboard

const StudentAnnouncements = () => {
  const { accounts } = useMsal();
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

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
        } else {
          console.error("Failed to fetch announcements");
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, [accounts]);

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
      <div className="announcements-section">
        <h2>Class Announcements</h2>
        <div className="announcements-content">
          {announcementsLoading ? (
            <div className="loading-message">Loading announcements...</div>
          ) : announcements.length > 0 ? (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-header">
                    <div className="announcement-title-section">
                      <h4 className="announcement-title">
                        {announcement.title}
                      </h4>
                      <span
                        className={`announcement-priority ${announcement.priority}`}
                      >
                        {getPriorityText(announcement.priority)}
                      </span>
                    </div>
                    <div className="announcement-meta">
                      <span className="announcement-date">
                        {formatAnnouncementDate(announcement.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="announcement-class-info">
                    <span className="class-subject">
                      📚{" "}
                      {announcement.classInfo?.subject || "Unknown Subject"}
                    </span>
                    <span className="class-details">
                      Grade {announcement.classInfo?.grade || "N/A"} • 👨‍🏫{" "}
                      {announcement.classInfo?.teacherName ||
                        "Unknown Teacher"}
                    </span>
                  </div>
                  <div className="announcement-message">
                    <p>{announcement.message}</p>
                  </div>
                  <div className="announcement-footer">
                    <small className="teacher-email">
                      From: {announcement.teacherEmail}
                    </small>
                    <small className="announcement-time">
                      {formatAnnouncementTime(announcement.createdAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-announcements-message">
              <p>📢 No announcements yet!</p>
              <span>
                Your teachers will post important updates and announcements
                here.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnnouncements;