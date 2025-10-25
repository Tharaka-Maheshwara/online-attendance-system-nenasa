import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today"); // "today" or "all"

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLoading(true);

        // Get current user info to identify the teacher
        const account = accounts[0];
        const userEmail = account.username;

        // Get teacher info
        const teacherResponse = await fetch(
          `http://localhost:8000/teacher/by-email/${encodeURIComponent(userEmail)}`
        );
        
        if (!teacherResponse.ok) {
          console.error("Failed to fetch teacher data:", teacherResponse.status);
          setLoading(false);
          return;
        }
        
        const teacher = await teacherResponse.json();

        if (!teacher || !teacher.id) {
          console.warn("No teacher found for email:", userEmail);
          setLoading(false);
          return;
        }

        console.log('Teacher Found:', teacher);
        setTeacherInfo(teacher);
        const teacherId = teacher.id;
        const teacherName = teacher.name;

        console.log('Teacher Info:', { teacherId, teacherName, email: userEmail });

        // Get today's classes
        const todayClassesResponse = await fetch(
          `http://localhost:8000/teacher/${teacherId}/classes/today`
        );
        const todayData = await todayClassesResponse.json();
        console.log('Today Classes Response:', todayData);
        setTodayClasses(Array.isArray(todayData) ? todayData : []);

        // Get all classes for this teacher
        const allClassesResponse = await fetch(
          `http://localhost:8000/class`
        );
        const allClassesData = await allClassesResponse.json();
        console.log('All Classes Data:', allClassesData);
        
        // Filter classes by teacher name (not teacherId)
        const teacherClasses = allClassesData.filter(
          (cls) => cls.teacherName === teacherName || cls.teacherId === teacherId
        );
        console.log('Filtered Teacher Classes:', teacherClasses);
        setAllClasses(teacherClasses);

      } catch (error) {
        console.error("Error fetching teacher data:", error);
        setTodayClasses([]);
        setAllClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [accounts]);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":");
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const getDayColor = (day) => {
    const colors = {
      Monday: "#667eea",
      Tuesday: "#f093fb",
      Wednesday: "#4facfe",
      Thursday: "#43e97b",
      Friday: "#fa709a",
      Saturday: "#feca57",
      Sunday: "#ff6b6b",
    };
    return colors[day] || "#667eea";
  };

  const groupClassesByDay = (classes) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const grouped = {};
    
    days.forEach(day => {
      grouped[day] = classes.filter(cls => cls.dayOfWeek === day);
    });
    
    return grouped;
  };

  const displayedClasses = activeTab === "today" ? todayClasses : allClasses;
  const groupedClasses = activeTab === "all" ? groupClassesByDay(allClasses) : null;

  return (
    <div className="teacher-dashboard">
      {/* Teacher Info Header */}
      {teacherInfo && (
        <div className="teacher-info-header">
          <div className="teacher-avatar">
            {teacherInfo.profileImage ? (
              <img 
                src={`http://localhost:8000${teacherInfo.profileImage}`} 
                alt={teacherInfo.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="avatar-placeholder" style={{display: teacherInfo.profileImage ? 'none' : 'flex'}}>
              {teacherInfo.name?.charAt(0) || "T"}
            </div>
          </div>
          <div className="teacher-details">
            <h1>Welcome, {teacherInfo.name}!</h1>
            <p className="teacher-email">📧 {teacherInfo.email}</p>
            <p className="teacher-phone">📱 {teacherInfo.phone || "N/A"}</p>
          </div>
          <div className="teacher-stats-summary">
            <div className="stat-box">
              <div className="stat-number">{allClasses.length}</div>
              <div className="stat-label">Total Classes</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{todayClasses.length}</div>
              <div className="stat-label">Today's Classes</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "today" ? "active" : ""}`}
          onClick={() => setActiveTab("today")}
        >
          📅 Today's Classes
        </button>
        <button
          className={`tab-button ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          📚 All My Classes
        </button>
      </div>

      {/* Classes Display */}
      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading class information...</p>
          </div>
        ) : activeTab === "today" ? (
          <div className="today-classes-section">
            <h2>Classes Scheduled for Today</h2>
            {todayClasses.length > 0 ? (
              <div className="class-cards-grid">
                {todayClasses.map((cls) => (
                  <div className="class-detail-card" key={cls.id}>
                    <div className="card-header" style={{ background: getDayColor(cls.dayOfWeek) }}>
                      <div className="class-icon">📖</div>
                      <div className="class-title-section">
                        <h3>{cls.subject}</h3>
                        <span className="grade-badge">Grade {cls.grade}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">🗓️ Day:</span>
                        <span className="info-value">{cls.dayOfWeek}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">⏰ Time:</span>
                        <span className="info-value">
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">💰 Monthly Fee:</span>
                        <span className="info-value">
                          Rs. {cls.monthlyFees ? cls.monthlyFees.toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="card-footer">
                      <button className="action-btn-small primary">
                        ✏️ Mark Attendance
                      </button>
                      <button className="action-btn-small secondary">
                        📝 Add Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Classes Today</h3>
                <p>You don't have any classes scheduled for today ({new Date().toLocaleDateString('en-US', { weekday: 'long' })}).</p>
                {allClasses.length > 0 && (
                  <p style={{ marginTop: '10px', color: '#667eea' }}>
                    You have {allClasses.length} total {allClasses.length === 1 ? 'class' : 'classes'}. 
                    Check the "All My Classes" tab to see your full schedule.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="all-classes-section">
            <h2>All Classes - Organized by Day</h2>
            {allClasses.length > 0 ? (
              <div className="classes-by-day">
                {Object.entries(groupedClasses).map(([day, classes]) => (
                  classes.length > 0 && (
                    <div className="day-section" key={day}>
                      <div className="day-header" style={{ borderLeftColor: getDayColor(day) }}>
                        <h3>{day}</h3>
                        <span className="class-count">{classes.length} {classes.length === 1 ? 'Class' : 'Classes'}</span>
                      </div>
                      <div className="day-classes-list">
                        {classes.map((cls) => (
                          <div className="class-item" key={cls.id}>
                            <div className="class-item-header">
                              <div className="subject-info">
                                <h4>{cls.subject}</h4>
                                <span className="grade-tag">Grade {cls.grade}</span>
                              </div>
                              <div className="time-info">
                                <span className="time-badge">
                                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                </span>
                              </div>
                            </div>
                            <div className="class-item-details">
                              <span className="detail-item">
                                💰 Rs. {cls.monthlyFees ? cls.monthlyFees.toLocaleString() : "N/A"}
                              </span>
                              <span className="detail-item">
                                📊 Class ID: {cls.id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No Classes Assigned</h3>
                <p>You don't have any classes assigned yet.</p>
                {teacherInfo && (
                  <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem', color: '#718096' }}>
                    <p style={{ margin: '5px 0' }}><strong>Your Profile:</strong></p>
                    <p style={{ margin: '5px 0' }}>Name: {teacherInfo.name}</p>
                    <p style={{ margin: '5px 0' }}>Email: {teacherInfo.email}</p>
                    <p style={{ margin: '5px 0', marginTop: '10px', color: '#667eea' }}>
                      Classes should have <strong>teacherName = "{teacherInfo.name}"</strong> in the database.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
