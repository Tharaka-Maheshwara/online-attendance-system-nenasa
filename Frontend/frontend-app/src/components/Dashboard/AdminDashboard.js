import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-grid">
        {/* Statistics Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <p className="stat-number">150</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-info">
              <h3>Total Teachers</h3>
              <p className="stat-number">15</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>Total Classes</h3>
              <p className="stat-number">25</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Today's Attendance</h3>
              <p className="stat-number">85%</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">
              <span className="btn-icon">➕</span>
              Add New Student
            </button>
            <button className="action-btn secondary">
              <span className="btn-icon">🏫</span>
              Manage Classes
            </button>
            <button className="action-btn tertiary">
              <span className="btn-icon">📋</span>
              View Reports
            </button>
            <button className="action-btn quaternary">
              <span className="btn-icon">⚙️</span>
              System Settings
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-details">
                <p>Grade 12 - Physics class attendance marked</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-details">
                <p>New student John Doe registered</p>
                <span className="activity-time">4 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📧</div>
              <div className="activity-details">
                <p>Attendance report sent to parents</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="system-overview">
          <h2>System Overview</h2>
          <div className="overview-items">
            <div className="overview-item">
              <span className="overview-label">Server Status</span>
              <span className="status-indicator online">Online</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Database</span>
              <span className="status-indicator online">Connected</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Email Service</span>
              <span className="status-indicator online">Active</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Backup Status</span>
              <span className="status-indicator warning">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
