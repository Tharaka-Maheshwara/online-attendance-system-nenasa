import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import LoginButton from "./LoginButton";
import Dashboard from "./components/Dashboard/Dashboard";
import AttendanceMarking from "./AttendanceMarking";
import Navbar from "./components/Navbar/Navbar";
import UserManagement from "./components/UserManagement/UserManagement";
import NotificationTest from "./components/Notification/NotificationTest";
import RoleAssignment from "./components/RoleAssignment/RoleAssignment";
import useAutoUserProvision from "./hooks/useAutoUserProvision";
import "./App.css";

const msalInstance = new PublicClientApplication(msalConfig);

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
        <main style={{ padding: '0', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<AttendanceMarking />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/notifications" element={<NotificationTest />} />
            <Route path="/role-assignment" element={<RoleAssignment />} />
            <Route path="/classes" element={<Dashboard />} />
            <Route path="/reports" element={<Dashboard />} />
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
