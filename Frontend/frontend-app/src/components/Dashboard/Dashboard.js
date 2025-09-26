import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { accounts } = useMsal();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncAzureUser = async () => {
      if (accounts.length > 0) {
        const user = accounts[0];
        console.log('Azure AD User Data:', user); // Debug log
        
        try {
          // POST user info to backend for auto-create/update
          const response = await fetch('http://localhost:8000/users/azure-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.username,
              displayName: user.name || user.displayName,
              azureId: user.localAccountId || user.homeAccountId || user.accountIdentifier
            })
          });
          
          if (response.ok) {
            console.log('User synced successfully');
          } else {
            console.error('Failed to sync user:', response.status);
          }
        } catch (error) {
          console.error('Error syncing Azure user:', error);
        }
      }
    };
    syncAzureUser();
  }, [accounts]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (accounts.length > 0) {
          const user = accounts[0];
          // Call backend API to get user role based on email
          const response = await fetch(`http://localhost:8000/users/profile/${user.username}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUserRole(userData.role);
          } else {
            // If user doesn't exist in backend, default to student role
            setUserRole('student');
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError('Failed to load user information');
        // Default to student role if error occurs
        setUserRole('student');
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, [accounts]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <StudentDashboard />; // Default to student dashboard
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          {userRole === 'admin' && 'Admin Dashboard'}
          {userRole === 'teacher' && 'Teacher Dashboard'}
          {userRole === 'student' && 'Student Dashboard'}
        </h1>
        {accounts.length > 0 && (
          <div className="user-info">
            <span>Welcome, {accounts[0].name}!</span>
            <span className="user-role">{userRole?.toUpperCase()}</span>
          </div>
        )}
      </div>
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
