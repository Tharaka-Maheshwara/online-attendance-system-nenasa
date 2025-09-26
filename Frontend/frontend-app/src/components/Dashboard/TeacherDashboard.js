import React from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  return (
    <div className="teacher-dashboard">
      <div className="dashboard-grid">
        {/* My Classes Section */}
        <div className="my-classes">
          <h2>My Classes Today</h2>
          <div className="class-cards">
            <div className="class-card">
              <div className="class-header">
                <h3>Grade 12 - Physics</h3>
                <span className="class-time">9:00 AM - 10:30 AM</span>
              </div>
              <div className="class-details">
                <p>Students: 25</p>
                <p>Present: 23</p>
                <p>Absent: 2</p>
              </div>
              <div className="class-actions">
                <button className="btn-primary" onClick={() => window.location.href = '/attendance'}>Mark Attendance</button>
                <button className="btn-secondary">View Details</button>
              </div>
            </div>
            
            <div className="class-card">
              <div className="class-header">
                <h3>Grade 11 - Chemistry</h3>
                <span className="class-time">2:00 PM - 3:30 PM</span>
              </div>
              <div className="class-details">
                <p>Students: 30</p>
                <p>Present: -</p>
                <p>Status: Upcoming</p>
              </div>
              <div className="class-actions">
                <button className="btn-primary" disabled>Mark Attendance</button>
                <button className="btn-secondary">View Details</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="teacher-stats">
          <h2>Quick Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">5</div>
              <div className="stat-label">Classes Today</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">120</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">92%</div>
              <div className="stat-label">Avg Attendance</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Pending Reports</div>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="recent-attendance">
          <h2>Recent Attendance</h2>
          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Grade 12 - Physics</td>
                  <td>2025-09-08</td>
                  <td>23</td>
                  <td>2</td>
                  <td>92%</td>
                </tr>
                <tr>
                  <td>Grade 11 - Chemistry</td>
                  <td>2025-09-07</td>
                  <td>28</td>
                  <td>2</td>
                  <td>93%</td>
                </tr>
                <tr>
                  <td>Grade 10 - Biology</td>
                  <td>2025-09-06</td>
                  <td>22</td>
                  <td>3</td>
                  <td>88%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="teacher-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => window.location.href = '/attendance'}>
              <span className="btn-icon">✓</span>
              Mark Attendance
            </button>
            <button className="action-btn secondary">
              <span className="btn-icon">📊</span>
              Generate Report
            </button>
            <button className="action-btn tertiary">
              <span className="btn-icon">👥</span>
              Manage Students
            </button>
            <button className="action-btn quaternary">
              <span className="btn-icon">📝</span>
              Leave Requests
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="notifications">
          <h2>Notifications</h2>
          <div className="notification-list">
            <div className="notification-item">
              <div className="notification-icon">⚠️</div>
              <div className="notification-content">
                <p>Student John Doe has low attendance (65%)</p>
                <span className="notification-time">1 hour ago</span>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">📝</div>
              <div className="notification-content">
                <p>Leave request from Sarah Wilson pending approval</p>
                <span className="notification-time">3 hours ago</span>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon">✅</div>
              <div className="notification-content">
                <p>Attendance report submitted successfully</p>
                <span className="notification-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
