import React from 'react';
import './StudentDashboard.css';

const StudentDashboard = () => {
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
            <div className="schedule-item completed">
              <div className="time-slot">9:00 AM</div>
              <div className="class-info">
                <h4>Mathematics</h4>
                <p>Room: A101</p>
                <p>Teacher: Mr. Perera</p>
              </div>
              <div className="attendance-status">
                <span className="status-badge present">Present</span>
              </div>
            </div>
            
            <div className="schedule-item current">
              <div className="time-slot">11:00 AM</div>
              <div className="class-info">
                <h4>Physics</h4>
                <p>Room: B205</p>
                <p>Teacher: Ms. Silva</p>
              </div>
              <div className="attendance-status">
                <span className="status-badge current">In Progress</span>
              </div>
            </div>
            
            <div className="schedule-item upcoming">
              <div className="time-slot">2:00 PM</div>
              <div className="class-info">
                <h4>Chemistry</h4>
                <p>Room: Lab 1</p>
                <p>Teacher: Dr. Fernando</p>
              </div>
              <div className="attendance-status">
                <span className="status-badge upcoming">Upcoming</span>
              </div>
            </div>
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
                <p>Your attendance is below 90%. Please maintain regular attendance.</p>
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
                  <div className="progress-fill" style={{width: '95%'}}></div>
                </div>
                <span className="progress-text">95%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Physics</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '88%'}}></div>
                </div>
                <span className="progress-text">88%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Chemistry</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '82%'}}></div>
                </div>
                <span className="progress-text">82%</span>
              </div>
            </div>
            <div className="subject-item">
              <div className="subject-name">Biology</div>
              <div className="subject-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '90%'}}></div>
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
