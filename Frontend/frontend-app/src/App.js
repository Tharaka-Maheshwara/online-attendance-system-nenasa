import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import LoginButton from "./LoginButton";
import Dashboard from "./components/Dashboard/Dashboard";
import AttendanceMarking from "./AttendanceMarking";
import Navbar from "./components/Navbar/Navbar";
import StudentManagement from "./components/StudentManagement/StudentManagement";
import TeacherManagement from "./components/TeacherManagement/TeacherManagement";
import ClassManagement from "./components/ClassManagement/ClassManagement";
import CourseManagement from "./components/Management/CourseManagement";
import StudentCourseView from "./components/Student/StudentCourseView";
import NotificationTest from "./components/Notification/NotificationTest";
import RoleAssignment from "./components/RoleAssignment/RoleAssignment";
import StudentAttendanceHistory from "./components/StudentAttendanceHistory/StudentAttendanceHistory";
import RegisterNumberLookup from "./components/RegisterNumberLookup/RegisterNumberLookup";
import AdminAttendanceMarking from "./components/AdminAttendanceMarking/AdminAttendanceMarking";
import TeacherAnnouncements from "./components/Announcements/TeacherAnnouncements";
import TeacherLectureNotes from "./components/LectureNotes/TeacherLectureNotes";
import StudentPaymentStatus from "./components/Student/StudentPaymentStatus";
import StudentLectureNotes from "./components/Student/StudentLectureNotes";
import StudentAnnouncements from "./components/Student/StudentAnnouncements";
import StudentAttendanceByClass from "./components/Student/StudentAttendanceByClass";
import useAutoUserProvision from "./hooks/useAutoUserProvision";
import "./App.css";

// Helper to get current user role from sessionStorage
function getCurrentUserRole() {
  try {
    const user = sessionStorage.getItem("currentUser");
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.role;
    }
  } catch (e) {}
  return null;
}

// PrivateRoute component for role-based access
function PrivateRoute({ element, allowedRoles }) {
  const role = getCurrentUserRole();
  if (!role) return <Navigate to="/" replace />;
  if (allowedRoles.includes(role)) {
    return element;
  }
  // If not allowed, redirect to dashboard
  return <Navigate to="/dashboard" replace />;
}

export const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  // Auto-provision user when they login
  useAutoUserProvision();

  if (!isAuthenticated) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Online Attendance System</h1>
          <LoginButton />
        </header>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main
          style={{
            padding: "0",
            backgroundColor: "#f5f7fa",
            minHeight: "100vh",
          }}
        >
          <Routes>
            {/* All roles can access dashboard */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Attendance: admin only */}
            <Route
              path="/attendance"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<AttendanceMarking />}
                />
              }
            />

            {/* Student management: admin only */}
            <Route
              path="/students"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<StudentManagement />}
                />
              }
            />

            {/* Teacher management: admin only */}
            <Route
              path="/teachers"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<TeacherManagement />}
                />
              }
            />

            {/* Notifications: admin only */}
            <Route
              path="/notifications"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<NotificationTest />}
                />
              }
            />

            {/* Role assignment: admin only */}
            <Route
              path="/role-assignment"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<RoleAssignment />}
                />
              }
            />

            {/* Register number lookup: all roles */}
            <Route
              path="/register-lookup"
              element={
                <PrivateRoute
                  allowedRoles={["admin", "teacher", "student"]}
                  element={<RegisterNumberLookup />}
                />
              }
            />

            {/* Classes: admin only */}
            <Route
              path="/classes"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<ClassManagement />}
                />
              }
            />

            {/* Courses: admin only */}
            <Route
              path="/courses"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<CourseManagement />}
                />
              }
            />

            {/* Student Course View: students only */}
            <Route
              path="/course-catalog"
              element={
                <PrivateRoute
                  allowedRoles={["student"]}
                  element={<StudentCourseView />}
                />
              }
            />

            {/* Student Payment Status: students only */}
            <Route
              path="/payment-status"
              element={
                <PrivateRoute
                  allowedRoles={["student"]}
                  element={<StudentPaymentStatus />}
                />
              }
            />

            {/* Student Lecture Notes: students only */}
            <Route
              path="/lecture-notes"
              element={
                <PrivateRoute
                  allowedRoles={["student"]}
                  element={<StudentLectureNotes />}
                />
              }
            />

            {/* Student Announcements: students only */}
            <Route
              path="/announcements"
              element={
                <PrivateRoute
                  allowedRoles={["student"]}
                  element={<StudentAnnouncements />}
                />
              }
            />

            {/* Student Attendance by Class: students only */}
            <Route
              path="/my-attendance"
              element={
                <PrivateRoute
                  allowedRoles={["student"]}
                  element={<StudentAttendanceByClass />}
                />
              }
            />

            {/* Reports: admin only */}
            <Route
              path="/reports"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<Dashboard />}
                />
              }
            />

            {/* Student Attendance History: admin only */}
            <Route
              path="/attendance-history"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<StudentAttendanceHistory />}
                />
              }
            />

            {/* Admin attendance marking: admin only */}
            <Route
              path="/admin/mark-attendance"
              element={
                <PrivateRoute
                  allowedRoles={["admin"]}
                  element={<AdminAttendanceMarking />}
                />
              }
            />

            {/* Teacher announcements: teacher only */}
            <Route
              path="/teacher/announcements"
              element={
                <PrivateRoute
                  allowedRoles={["teacher"]}
                  element={<TeacherAnnouncements />}
                />
              }
            />

            {/* Teacher lecture notes: teacher only */}
            <Route
              path="/teacher/lecture-notes"
              element={
                <PrivateRoute
                  allowedRoles={["teacher"]}
                  element={<TeacherLectureNotes />}
                />
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AppContent />
    </MsalProvider>
  );
}

export default App;
