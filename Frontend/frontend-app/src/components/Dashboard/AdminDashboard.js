import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState('student');
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [notification, setNotification] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');

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

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* User Management Section */}
        <div className="user-management">
          <h2>User Management</h2>
          
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users by email or role..."
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
                <option value="admin">Admin</option>
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
        {/* ...existing dashboard code... */}
      </div>
    </div>
  );
};

export default AdminDashboard;
