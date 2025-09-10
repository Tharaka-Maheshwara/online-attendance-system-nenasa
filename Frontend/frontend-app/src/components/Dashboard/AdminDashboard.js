import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState('student');

  React.useEffect(() => {
    // Fetch all users from backend
    fetch('http://localhost:8000/users')
      .then(res => res.json())
      .then(data => setUsers(data));
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

  const saveRole = async () => {
    if (!selectedUser) return;
    await fetch(`http://localhost:8000/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
    closeRoleModal();
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-grid">
        {/* ...existing dashboard code... */}

        {/* User Management Section */}
        <div className="user-management">
          <h2>User Management</h2>
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
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => openRoleModal(user)}>Edit Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Role Edit Modal */}
        {roleModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Edit User Role</h3>
              <p>Email: {selectedUser.email}</p>
              <select value={newRole} onChange={handleRoleChange}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <div className="modal-actions">
                <button onClick={saveRole}>Save</button>
                <button onClick={closeRoleModal}>Cancel</button>
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
