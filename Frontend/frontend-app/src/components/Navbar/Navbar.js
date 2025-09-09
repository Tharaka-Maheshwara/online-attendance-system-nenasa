import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import './Navbar.css';

const Navbar = () => {
  const { accounts, instance } = useMsal();
  const [userRole, setUserRole] = useState('student');
  const location = useLocation();

  useEffect(() => {
    fetchUserRole();
  }, [accounts]);

  const fetchUserRole = async () => {
    try {
      if (accounts.length > 0) {
        const user = accounts[0];
        const response = await fetch(`http://localhost:8000/users/profile/${user.username}`);
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            🎓 NENASA Attendance
          </Link>
        </div>

        <div className="navbar-menu">
          <div className="navbar-nav">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/') || isActive('/dashboard') ? 'active' : ''}`}
            >
              🏠 Dashboard
            </Link>
            
            {(userRole === 'teacher' || userRole === 'admin') && (
              <Link 
                to="/attendance" 
                className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
              >
                ✓ Mark Attendance
              </Link>
            )}

            {userRole === 'student' && (
              <Link 
                to="/attendance" 
                className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
              >
                📱 Scan QR
              </Link>
            )}

            {userRole === 'admin' && (
              <>
                <Link to="/classes" className="nav-link">
                  📚 Classes
                </Link>
                <Link to="/students" className="nav-link">
                  👥 Students
                </Link>
                <Link to="/reports" className="nav-link">
                  📊 Reports
                </Link>
              </>
            )}
          </div>

          <div className="navbar-user">
            <div className="user-info">
              <span className="user-name">{accounts[0]?.name}</span>
              <span className="user-role">{userRole.toUpperCase()}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
