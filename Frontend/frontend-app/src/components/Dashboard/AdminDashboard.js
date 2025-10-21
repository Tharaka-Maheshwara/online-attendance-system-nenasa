import React from "react";
import { useLocation } from "react-router-dom";
import "./AdminDashboard.css";
import StudentAttendanceHistory from "../StudentAttendanceHistory/StudentAttendanceHistory";

const AdminDashboard = () => {
  const { pathname } = useLocation();
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState("student");
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [notification, setNotification] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("student"); // New state for tab selection
  const [showAttendanceHistory, setShowAttendanceHistory] =
    React.useState(false);

  // Class Management States
  const [classes, setClasses] = React.useState([]);
  const [classLoading, setClassLoading] = React.useState(true);
  const [classModalOpen, setClassModalOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [classFormData, setClassFormData] = React.useState({
    name: "",
    subject: "",
  });

  React.useEffect(() => {
    // Fetch all users from backend
    setLoading(true);
    fetch("http://localhost:8000/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
        setNotification({ type: "error", message: "Failed to load users" });
        setLoading(false);
      });

    // Fetch all classes from backend
    setClassLoading(true);
    fetch("http://localhost:8000/class")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data);
        setClassLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
        setNotification({ type: "error", message: "Failed to load classes" });
        setClassLoading(false);
      });
  }, []);

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const filteredUsers = users.filter((user) => {
    // Never show admin users
    if (user.role === "admin") return false;

    // Filter by active tab
    if (activeTab === "student" && user.role !== "student") return false;
    if (activeTab === "teacher" && user.role !== "teacher") return false;

    // Filter by search term
    if (
      searchTerm &&
      !(
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
      return false;

    return true;
  });

  // Auto-hide notification after 3 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const saveRole = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `http://localhost:8000/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id ? { ...u, role: newRole } : u
          )
        );
        setNotification({
          type: "success",
          message: "Role updated successfully!",
        });
        closeRoleModal();
      } else {
        setNotification({ type: "error", message: "Failed to update role" });
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setNotification({ type: "error", message: "Error updating role" });
    } finally {
      setUpdating(false);
    }
  };

  // Class Management Functions
  const openClassModal = (cls = null) => {
    if (cls) {
      setSelectedClass(cls);
      setClassFormData({
        name: cls.name || "",
        subject: cls.subject || "",
      });
    } else {
      setSelectedClass(null);
      setClassFormData({
        name: "",
        subject: "",
      });
    }
    setClassModalOpen(true);
  };

  const closeClassModal = () => {
    setClassModalOpen(false);
    setSelectedClass(null);
  };

  const handleClassInputChange = (e) => {
    const { name, value } = e.target;
    setClassFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveClass = async () => {
    setUpdating(true);
    try {
      const url = selectedClass
        ? `http://localhost:8000/class/${selectedClass.id}`
        : "http://localhost:8000/class";
      const method = selectedClass ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...classFormData,
          teacherId: classFormData.teacherId
            ? parseInt(classFormData.teacherId)
            : null,
        }),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        if (selectedClass) {
          setClasses(
            classes.map((c) => (c.id === selectedClass.id ? updatedClass : c))
          );
          setNotification({
            type: "success",
            message: "Class updated successfully!",
          });
        } else {
          setClasses([...classes, updatedClass]);
          setNotification({
            type: "success",
            message: "Class created successfully!",
          });
        }
        closeClassModal();
      } else {
        setNotification({ type: "error", message: "Failed to save class" });
      }
    } catch (error) {
      console.error("Error saving class:", error);
      setNotification({ type: "error", message: "Error saving class" });
    } finally {
      setUpdating(false);
    }
  };

  const deleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;

    try {
      const response = await fetch(`http://localhost:8000/class/${classId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setClasses(classes.filter((c) => c.id !== classId));
        setNotification({
          type: "success",
          message: "Class deleted successfully!",
        });
      } else {
        setNotification({ type: "error", message: "Failed to delete class" });
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      setNotification({ type: "error", message: "Error deleting class" });
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Statistics Summary Cards */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">
            <span>👥</span>
          </div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <p className="stat-number">
              {users.filter((u) => u.role === "student").length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span>👨‍🏫</span>
          </div>
          <div className="stat-info">
            <h3>Total Teachers</h3>
            <p className="stat-number">
              {users.filter((u) => u.role === "teacher").length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span>📚</span>
          </div>
          <div className="stat-info">
            <h3>Total Classes</h3>
            <p className="stat-number">{classes.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span>📊</span>
          </div>
          <div className="stat-info">
            <h3>System Status</h3>
            <p className="stat-number">Active</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions Panel */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => window.location.href = '/students'}
            >
              <span className="btn-icon">👥</span>
              Manage Students
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/teachers'}
            >
              <span className="btn-icon">👨‍🏫</span>
              Manage Teachers
            </button>
            <button 
              className="action-btn tertiary"
              onClick={() => window.location.href = '/classes'}
            >
              <span className="btn-icon">📚</span>
              Manage Classes
            </button>
            <button 
              className="action-btn quaternary"
              onClick={() => window.location.href = '/attendance'}
            >
              <span className="btn-icon">✅</span>
              Mark Attendance
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="system-overview">
          <h2>System Overview</h2>
          <div className="overview-items">
            <div className="overview-item">
              <span className="overview-label">Database Status</span>
              <span className="status-indicator online">Online</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Last Backup</span>
              <span className="status-indicator warning">2 days ago</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Active Sessions</span>
              <span className="status-indicator online">
                {users.filter((u) => u.role !== "admin").length} users
              </span>
            </div>
            <div className="overview-item">
              <span className="overview-label">System Health</span>
              <span className="status-indicator online">Excellent</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-details">
                <p>New student registration completed</p>
                <div className="activity-time">2 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-details">
                <p>Attendance marked for English - Grade 9</p>
                <div className="activity-time">15 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👨‍🏫</div>
              <div className="activity-details">
                <p>Teacher profile updated</p>
                <div className="activity-time">1 hour ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📚</div>
              <div className="activity-details">
                <p>New class created: Mathematics</p>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
        {/* ...existing dashboard code... */}

        {(pathname === "/user" ||
          pathname === "/dashboard" ||
          pathname === "/") && (
          <div className="user-management">
            <h2>User List</h2>

            {/* Tabs for Students/Teachers */}
            <div className="user-tabs">
              <button
                className={`tab-button ${
                  activeTab === "student" ? "active" : ""
                }`}
                onClick={() => setActiveTab("student")}
              >
                Students
              </button>
              <button
                className={`tab-button ${
                  activeTab === "teacher" ? "active" : ""
                }`}
                onClick={() => setActiveTab("teacher")}
              >
                Teachers
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                placeholder={`Search ${
                  activeTab === "student" ? "users" : "teachers"
                } by email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Role Edit Modal */}
        {roleModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit User Role</h3>
              <p>Email: {selectedUser.email}</p>
              <select
                value={newRole}
                onChange={handleRoleChange}
                disabled={updating}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                {/* Admin option removed - admins should not be assignable from this interface */}
              </select>
              <div className="modal-actions">
                <button onClick={saveRole} disabled={updating}>
                  {updating ? "Saving..." : "Save"}
                </button>
                <button onClick={closeRoleModal} disabled={updating}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Class Management - Always show on dashboard */}
        <div className="class-management">
          <div className="section-header">
            <h2>Class List</h2>
          </div>

          {classLoading ? (
            <div className="loading">Loading classes...</div>
          ) : (
            <div className="class-grid">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="class-card"
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <div className="class-info">
                    <h3 style={{ color: "white" }}>{cls.name}</h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                      <strong>Subject:</strong>{" "}
                      {cls.subject || "Not specified"}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                      <strong>Day of Week:</strong>{" "}
                      {cls.dayOfWeek || "Not specified"}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                      <strong>Start Time:</strong>{" "}
                      {cls.startTime || "Not specified"}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                      <strong>End Time:</strong>{" "}
                      {cls.endTime || "Not specified"}
                    </p>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="no-classes">
                  <p>No classes found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Attendance History Section */}
        {pathname === "/attendance-history" && (
          <div className="attendance-history-section">
            <StudentAttendanceHistory />
          </div>
        )}

        {/* Class Edit/Create Modal */}
        {classModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{selectedClass ? "Edit Class" : "Add New Class"}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveClass();
                }}
              >
                <div className="form-group">
                  <label>Class Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={classFormData.name}
                    onChange={handleClassInputChange}
                    required
                    disabled={updating}
                  />
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={classFormData.subject}
                    onChange={handleClassInputChange}
                    disabled={updating}
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" disabled={updating}>
                    {updating
                      ? "Saving..."
                      : selectedClass
                      ? "Update Class"
                      : "Create Class"}
                  </button>
                  <button
                    type="button"
                    onClick={closeClassModal}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ...existing dashboard code... */}
      </div>
    </div>
  );
};

export default AdminDashboard;
