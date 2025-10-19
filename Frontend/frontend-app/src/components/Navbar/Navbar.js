import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import "./Navbar.css";

const Navbar = () => {
  const { accounts, instance } = useMsal();
  const [userRole, setUserRole] = useState("student");
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchUserRole();
    loadCurrentUser();
  }, [accounts]);

  const loadCurrentUser = () => {
    try {
      const storedUser = sessionStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const fetchUserRole = async () => {
    try {
      if (accounts.length > 0) {
        const user = accounts[0];
        const response = await fetch(
          `http://localhost:8000/users/profile/${user.username}`
        );
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          // Update current user with latest role
          const storedUser = sessionStorage.getItem("currentUser");
          if (storedUser) {
            const userObj = JSON.parse(storedUser);
            userObj.role = userData.role;
            sessionStorage.setItem("currentUser", JSON.stringify(userObj));
            setCurrentUser(userObj);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            🎓 NENASALA Attendance
          </Link>
        </div>

        <div className="navbar-menu">
          <div className="navbar-nav">
            <Link
              to="/dashboard"
              className={`nav-link ${
                isActive("/") || isActive("/dashboard") ? "active" : ""
              }`}
            >
              🏠 Dashboard
            </Link>

            {/* Course Catalog - available for students and teachers only */}
            {(userRole === "student" || userRole === "teacher") && (
              <Link
                to="/course-catalog"
                className={`nav-link ${
                  isActive("/course-catalog") ? "active" : ""
                }`}
              >
                📖 Course Catalog
              </Link>
            )}

            {(userRole === "teacher" || userRole === "admin") && (
              <Link
                to="/attendance"
                className={`nav-link ${
                  isActive("/attendance") ? "active" : ""
                }`}
              >
                ✓ Mark Attendance
              </Link>
            )}

            {/* Students no longer have access to attendance marking */}

            {userRole === "admin" && (
              <>
                <Link
                  to="/classes"
                  className={`nav-link ${isActive("/classes") ? "active" : ""}`}
                >
                  📚 Classes
                </Link>
                <Link
                  to="/courses"
                  className={`nav-link ${isActive("/courses") ? "active" : ""}`}
                >
                  🎯 Courses
                </Link>
                <Link
                  to="/students"
                  className={`nav-link ${
                    isActive("/students") ? "active" : ""
                  }`}
                >
                  🎓 Students
                </Link>
                <Link
                  to="/teachers"
                  className={`nav-link ${
                    isActive("/teachers") ? "active" : ""
                  }`}
                >
                  �‍🏫 Teachers
                </Link>

                <Link
                  to="/reports"
                  className={`nav-link ${isActive("/reports") ? "active" : ""}`}
                >
                  📊 Reports
                </Link>
                <Link
                  to="/attendance-history"
                  className={`nav-link ${
                    isActive("/attendance-history") ? "active" : ""
                  }`}
                >
                  📋 Attendance History
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
