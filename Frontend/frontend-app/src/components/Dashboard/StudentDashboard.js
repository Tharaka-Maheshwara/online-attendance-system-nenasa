import React, { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const { accounts } = useMsal();
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayClasses = async () => {
      if (!accounts || accounts.length === 0) return;

      try {
        setLoading(true);
        
        // Get current user email
        const userEmail = accounts[0].username;
        
        // Fetch today's classes for this student
        const response = await fetch(
          `http://localhost:8000/student/email/${encodeURIComponent(userEmail)}/classes/today`
        );
        
        if (response.ok) {
          const classes = await response.json();
          setTodayClasses(classes);
        } else {
          console.error('Failed to fetch today\'s classes');
          setTodayClasses([]);
        }
      } catch (error) {
        console.error('Error fetching today\'s classes:', error);
        setTodayClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayClasses();
  }, [accounts]);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':');
    const hourNum = parseInt(hour, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const getClassStatus = (startTime, endTime) => {
    if (!startTime || !endTime) return 'upcoming';
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const classStart = startHour * 60 + startMinute;
    const classEnd = endHour * 60 + endMinute;
    
    if (currentTime >= classStart && currentTime <= classEnd) {
      return 'current';
    } else if (currentTime > classEnd) {
      return 'completed';
    }
    return 'upcoming';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'status-badge present';
      case 'current': return 'status-badge current';
      case 'upcoming': return 'status-badge upcoming';
      default: return 'status-badge upcoming';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'current': return 'In Progress';
      case 'upcoming': return 'Upcoming';
      default: return 'Upcoming';
    }
  };
  return (
    <div className="student-dashboard">
      <div className="dashboard-grid">
        {/* Personal Stats */}
        <div className="personal-stats">
          <h2>My Attendance Summary</h2>
          <div className="stats-cards">
            <div className="stat-card primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Overall Attendance</h3>
                <p className="stat-percentage">87%</p>
                <span className="stat-detail">Good standing</span>
              </div>
            </div>
            <div className="stat-card secondary">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>This Month</h3>
                <p className="stat-percentage">92%</p>
                <span className="stat-detail">18/20 days</span>
              </div>
            </div>
            <div className="stat-card tertiary">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>Late Arrivals</h3>
                <p className="stat-number">3</p>
                <span className="stat-detail">This month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="todays-schedule">
          <h2>Today's Classes</h2>
          <div className="schedule-list">
            {loading ? (
              <div className="loading-message">Loading today's classes...</div>
            ) : todayClasses.length > 0 ? (
              todayClasses.map((cls) => {
                const status = getClassStatus(cls.startTime, cls.endTime);
                return (
                  <div className={`schedule-item ${status}`} key={cls.id}>
                    <div className="time-slot">
                      {cls.startTime ? formatTime(cls.startTime) : 'TBA'}
                      {cls.endTime && ` - ${formatTime(cls.endTime)}`}
                    </div>
                    <div className="class-info">
                      <h4>{cls.subject}</h4>
                      <p>Grade: {cls.grade || 'N/A'}</p>
                      <p>Teacher: {cls.teacherName || 'TBA'}</p>
                    </div>
                    <div className="attendance-status">
                      <span className={getStatusBadgeClass(status)}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-classes-message">
                <p>🎉 No classes scheduled for today!</p>
                <span>Enjoy your free day or catch up on your studies.</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="student-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn secondary">
              <span className="btn-icon">📝</span>
              Request Leave
            </button>
            <button className="action-btn tertiary">
              <span className="btn-icon">📊</span>
              View Reports
            </button>
            <button className="action-btn quaternary">
              <span className="btn-icon">👤</span>
              Update Profile
            </button>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="recent-attendance">
          <h2>Recent Attendance</h2>
          <div className="attendance-calendar">
            <div className="calendar-header">
              <span>Last 7 Days</span>
            </div>
            <div className="calendar-days">
              <div className="day-item">
                <span className="day-label">Mon</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Tue</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Wed</span>
                <div className="day-status absent">✗</div>
              </div>
              <div className="day-item">
                <span className="day-label">Thu</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Fri</span>
                <div className="day-status late">L</div>
              </div>
              <div className="day-item">
                <span className="day-label">Sat</span>
                <div className="day-status present">✓</div>
              </div>
              <div className="day-item">
                <span className="day-label">Sun</span>
                <div className="day-status holiday">H</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications">
          <h2>Notifications</h2>
          <div className="notification-list">
            <div className="notification-item warning">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <p>
                  Your attendance is below 90%. Please maintain regular
                  attendance.
                </p>
                <span className="notification-time">2 hours ago</span>
              </div>
            </div>
            <div className="notification-item info">
              <div className="notification-icon">📅</div>
              <div className="notification-content">
                <p>Chemistry class moved to Lab 2 tomorrow</p>
                <span className="notification-time">1 day ago</span>
              </div>
            </div>
            <div className="notification-item success">
              <div className="notification-icon">✅</div>
              <div className="notification-content">
                <p>Leave request approved for September 15th</p>
                <span className="notification-time">2 days ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="subject-attendance">
          <h2>Subject-wise Attendance</h2>
          <div className="subject-list">
            <div className="subject-item">
              <div className="subject-name">Mathematics</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "95%" }}></div>
                </div>
                <span className="progress-text">95%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Physics</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "88%" }}></div>
                </div>
                <span className="progress-text">88%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Chemistry</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "82%" }}></div>
                </div>
                <span className="progress-text">82%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Biology</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "90%" }}></div>
                </div>
                <span className="progress-text">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
