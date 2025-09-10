import React from 'react';
import { useLocation } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { pathname } = useLocation();
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState('student');
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [notification, setNotification] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('student'); // New state for tab selection

  // Class Management States
  const [classes, setClasses] = React.useState([]);
  const [classLoading, setClassLoading] = React.useState(true);
  const [classModalOpen, setClassModalOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [classFormData, setClassFormData] = React.useState({
    name: '',
    subject: '',
    batch: '',
    teacherId: ''
  });

  React.useEffect(() => {
    // Fetch all users from backend
    setLoading(true);
    fetch('http://localhost:8000/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setNotification({ type: 'error', message: 'Failed to load users' });
        setLoading(false);
      });

    // Fetch all classes from backend
    setClassLoading(true);
    fetch('http://localhost:8000/class')
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        setClassLoading(false);
      })
      .catch(error => {
        console.error('Error fetching classes:', error);
        setNotification({ type: 'error', message: 'Failed to load classes' });
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

  const filteredUsers = users.filter(user => {
    // Never show admin users
    if (user.role === 'admin') return false;
    
    // Filter by active tab
    if (activeTab === 'student' && user.role !== 'student') return false;
    if (activeTab === 'teacher' && user.role !== 'teacher') return false;
    
    // Filter by search term
    if (searchTerm && !(
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    
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
      const response = await fetch(`http://localhost:8000/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
        setNotification({ type: 'success', message: 'Role updated successfully!' });
        closeRoleModal();
      } else {
        setNotification({ type: 'error', message: 'Failed to update role' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setNotification({ type: 'error', message: 'Error updating role' });
    } finally {
      setUpdating(false);
    }
  };

  // Class Management Functions
  const openClassModal = (cls = null) => {
    if (cls) {
      setSelectedClass(cls);
      setClassFormData({
        name: cls.name || '',
        subject: cls.subject || '',
        batch: cls.batch || '',
        teacherId: cls.teacherId || ''
      });
    } else {
      setSelectedClass(null);
      setClassFormData({
        name: '',
        subject: '',
        batch: '',
        teacherId: ''
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
    setClassFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveClass = async () => {
    setUpdating(true);
    try {
      const url = selectedClass 
        ? `http://localhost:8000/class/${selectedClass.id}`
        : 'http://localhost:8000/class';
      const method = selectedClass ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...classFormData,
          teacherId: classFormData.teacherId ? parseInt(classFormData.teacherId) : null
        })
      });
      
      if (response.ok) {
        const updatedClass = await response.json();
        if (selectedClass) {
          setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
          setNotification({ type: 'success', message: 'Class updated successfully!' });
        } else {
          setClasses([...classes, updatedClass]);
          setNotification({ type: 'success', message: 'Class created successfully!' });
        }
        closeClassModal();
      } else {
        setNotification({ type: 'error', message: 'Failed to save class' });
      }
    } catch (error) {
      console.error('Error saving class:', error);
      setNotification({ type: 'error', message: 'Error saving class' });
    } finally {
      setUpdating(false);
    }
  };

  const deleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/class/${classId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setClasses(classes.filter(c => c.id !== classId));
        setNotification({ type: 'success', message: 'Class deleted successfully!' });
      } else {
        setNotification({ type: 'error', message: 'Failed to delete class' });
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      setNotification({ type: 'error', message: 'Error deleting class' });
    }
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    return teacher ? teacher.email : 'No teacher assigned';
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
      
      <div className="dashboard-grid">
        {/* ...existing dashboard code... */}

        {(pathname === '/user' || pathname === '/dashboard' || pathname === '/') &&
          <div className="user-management">
            <h2>User Management</h2>

            {/* Tabs for Students/Teachers */}
            <div className="user-tabs">
              <button
                className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
                onClick={() => setActiveTab('student')}
              >
                Students
              </button>
              <button
                className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
                onClick={() => setActiveTab('teacher')}
              >
                Teachers
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'student' ? 'users' : 'teachers'} by email...`}
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <button
                          onClick={() => openRoleModal(user)}
                          disabled={updating}
                        >
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        }

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
                <button
                  onClick={saveRole}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={closeRoleModal}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {(pathname === '/classes' || pathname === '/dashboard' || pathname === '/') &&
          <div className="class-management">
            <div className="section-header">
              <h2>Class Management</h2>
              <button
                className="add-button"
                onClick={() => openClassModal()}
              >
                Add New Class
              </button>
            </div>

            {classLoading ? (
              <div className="loading">Loading classes...</div>
            ) : (
              <div className="class-grid">
                {classes.map(cls => (
                  <div key={cls.id} className="class-card">
                    <div className="class-info">
                      <h3>{cls.name}</h3>
                      <p><strong>Subject:</strong> {cls.subject || 'Not specified'}</p>
                      <p><strong>Batch:</strong> {cls.batch || 'Not specified'}</p>
                      <p><strong>Teacher:</strong> {getTeacherName(cls.teacherId)}</p>
                    </div>
                    <div className="class-actions">
                      <button
                        className="edit-btn"
                        onClick={() => openClassModal(cls)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteClass(cls.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="no-classes">
                    <p>No classes found. Click "Add New Class" to create one.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        }

        {/* Class Edit/Create Modal */}
        {classModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{selectedClass ? 'Edit Class' : 'Add New Class'}</h3>
              <form onSubmit={(e) => { e.preventDefault(); saveClass(); }}>
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
                <div className="form-group">
                  <label>Batch</label>
                  <input
                    type="text"
                    name="batch"
                    value={classFormData.batch}
                    onChange={handleClassInputChange}
                    disabled={updating}
                  />
                </div>
                <div className="form-group">
                  <label>Assign Teacher</label>
                  <select
                    name="teacherId"
                    value={classFormData.teacherId}
                    onChange={handleClassInputChange}
                    disabled={updating}
                  >
                    <option value="">No teacher assigned</option>
                    {users.filter(u => u.role === 'teacher').map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button
                    type="submit"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : selectedClass ? 'Update Class' : 'Create Class'}
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
