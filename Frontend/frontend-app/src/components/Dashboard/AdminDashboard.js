import React from "react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState("student");
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [notification, setNotification] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("student"); // New state for tab selection

  // Class Management States
  const [classes, setClasses] = React.useState([]);
  const [classLoading, setClassLoading] = React.useState(true);
  const [classModalOpen, setClassModalOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [classFormData, setClassFormData] = React.useState({
    name: "",
    subject: "",
  });
  const [todayClasses, setTodayClasses] = React.useState([]);

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

        // Filter today's classes
        const today = new Date();
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const todayName = dayNames[today.getDay()];

        const todaysClasses = data.filter((cls) => cls.dayOfWeek === todayName);
        setTodayClasses(todaysClasses);
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

        {/* System Status card removed as requested */}
      </div>

      {/* Today's Classes Section */}
      <div className="today-classes-section">
        <h2 className="section-title">📅 Classes Held Today</h2>
        {classLoading ? (
          <div className="loading-message">Loading today's classes...</div>
        ) : todayClasses.length > 0 ? (
          <div className="today-classes-grid">
            {todayClasses.map((cls) => (
              <div className="today-class-card" key={cls.id}>
                <div
                  className="class-card-header"
                  style={{ background: getDayColor(cls.dayOfWeek) }}
                >
                  <div className="class-icon">📖</div>
                  <div className="class-title-info">
                    <h3>{cls.subject}</h3>
                    <span className="grade-badge">Grade {cls.grade}</span>
                  </div>
                </div>
                <div className="class-card-body">
                  <div className="class-info-row">
                    <span className="info-label">👨‍🏫 Teacher:</span>
                    <span className="info-value">
                      {cls.teacherName || "Not Assigned"}
                    </span>
                  </div>
                  <div className="class-info-row">
                    <span className="info-label">⏰ Time:</span>
                    <span className="info-value">
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </span>
                  </div>
                  {/* Removed Monthly Fee and Day rows as requested */}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Classes Today</h3>
            <p>
              There are no classes scheduled for today (
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}).
            </p>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Removed Quick Actions, System Overview, and Recent Activities sections as requested */}
        {/* ...existing dashboard code... */}

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
