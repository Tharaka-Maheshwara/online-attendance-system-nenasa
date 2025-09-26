import React, { useState, useEffect } from 'react';
import './RoleAssignment.css';

const RoleAssignment = () => {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, studentsRes, teachersRes] = await Promise.all([
        fetch('http://localhost:8000/users'),
        fetch('http://localhost:8000/students'),
        fetch('http://localhost:8000/teachers')
      ]);

      setUsers(await usersRes.json());
      setStudents(await studentsRes.json());
      setTeachers(await teachersRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRoleAssignment = async (userId, role) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Role assigned successfully: ${result.message}`);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error assigning role');
    }
    setLoading(false);
  };

  return (
    <div className="role-assignment-container">
      <h1>Role Assignment Management</h1>
      
      <div className="section">
        <h2>👥 All Users</h2>
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <h3>{user.display_name}</h3>
                <p>Email: {user.email}</p>
                <p>Register Number: {user.register_number || 'N/A'}</p>
                <p>Current Role: <span className={`role-badge ${user.role}`}>{user.role.toUpperCase()}</span></p>
              </div>
              <div className="role-actions">
                <button
                  onClick={() => handleRoleAssignment(user.id, 'student')}
                  disabled={loading || user.role === 'student'}
                  className="btn btn-student"
                >
                  Assign as Student
                </button>
                <button
                  onClick={() => handleRoleAssignment(user.id, 'teacher')}
                  disabled={loading || user.role === 'teacher'}
                  className="btn btn-teacher"
                >
                  Assign as Teacher
                </button>
                <button
                  onClick={() => handleRoleAssignment(user.id, 'admin')}
                  disabled={loading || user.role === 'admin'}
                  className="btn btn-admin"
                >
                  Assign as Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>👨‍🎓 Students Table ({students.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Guardian</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.student_id}</td>
                  <td>{student.user?.display_name || 'N/A'}</td>
                  <td>{student.user?.email || 'N/A'}</td>
                  <td>{student.grade || 'N/A'}</td>
                  <td>{student.guardian_name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${student.is_active ? 'active' : 'inactive'}`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>👨‍🏫 Teachers Table ({teachers.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Teacher ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id}>
                  <td>{teacher.teacher_id}</td>
                  <td>{teacher.user?.display_name || 'N/A'}</td>
                  <td>{teacher.user?.email || 'N/A'}</td>
                  <td>{teacher.department || 'N/A'}</td>
                  <td>{teacher.subject_specialization || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${teacher.is_active ? 'active' : 'inactive'}`}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignment;
