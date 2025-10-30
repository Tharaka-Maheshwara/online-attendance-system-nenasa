import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import "./Navbar.css";
import logo from "../../assets/images/nenasa-logo.jpg";

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
            <img src={logo} alt="NENASA Logo" className="navbar-logo" />
            <span className="brand-text">NENASA Attendance</span>
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
              Dashboard
            </Link>

            {/* Course Catalog - available for students only */}
            {userRole === "student" && (
              <>
                <Link
                  to="/course-catalog"
                  className={`nav-link ${
                    isActive("/course-catalog") ? "active" : ""
                  }`}
                >
                  Course Catalog
                </Link>
                <Link
                  to="/my-attendance"
                  className={`nav-link ${
                    isActive("/my-attendance") ? "active" : ""
                  }`}
                >
                  My Attendance
                </Link>
                <Link
                  to="/my-qr-code"
                  className={`nav-link ${
                    isActive("/my-qr-code") ? "active" : ""
                  }`}
                >
                  My QR Code
                </Link>
                <Link
                  to="/payment-status"
                  className={`nav-link ${
                    isActive("/payment-status") ? "active" : ""
                  }`}
                >
                  Payment Status
                </Link>
                <Link
                  to="/lecture-notes"
                  className={`nav-link ${
                    isActive("/lecture-notes") ? "active" : ""
                  }`}
                >
                  Lecture Notes
                </Link>
                <Link
                  to="/announcements"
                  className={`nav-link ${
                    isActive("/announcements") ? "active" : ""
                  }`}
                >
                  Announcements
                </Link>
              </>
            )}

            {/* Teacher Announcements - available for teachers only */}
            {userRole === "teacher" && (
              <Link
                to="/teacher/announcements"
                className={`nav-link ${
                  isActive("/teacher/announcements") ? "active" : ""
                }`}
              >
                📢 Announcements
              </Link>
            )}

            {/* Teacher Lecture Notes - available for teachers only */}
            {userRole === "teacher" && (
              <Link
                to="/teacher/lecture-notes"
                className={`nav-link ${
                  isActive("/teacher/lecture-notes") ? "active" : ""
                }`}
              >
                📚 Lecture Notes
              </Link>
            )}

            {/* Mark Attendance - available for admin only */}
            {userRole === "admin" && (
              <Link
                to="/attendance"
                className={`nav-link ${
                  isActive("/attendance") ? "active" : ""
                }`}
              >
                Mark Attendance
              </Link>
            )}

            {/* Students no longer have access to attendance marking */}

            {userRole === "admin" && (
              <>
                <Link
                  to="/classes"
                  className={`nav-link ${isActive("/classes") ? "active" : ""}`}
                >
                  Classes
                </Link>
                <Link
                  to="/courses"
                  className={`nav-link ${isActive("/courses") ? "active" : ""}`}
                >
                  Courses
                </Link>
                <Link
                  to="/students"
                  className={`nav-link ${
                    isActive("/students") ? "active" : ""
                  }`}
                >
                  Students
                </Link>
                <Link
                  to="/teachers"
                  className={`nav-link ${
                    isActive("/teachers") ? "active" : ""
                  }`}
                >
                  Teachers
                </Link>

                <Link
                  to="/attendance-history"
                  className={`nav-link ${
                    isActive("/attendance-history") ? "active" : ""
                  }`}
                >
                  Attendance History
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
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
