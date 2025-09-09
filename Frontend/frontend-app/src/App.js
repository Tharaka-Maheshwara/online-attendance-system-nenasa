import React from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import LoginButton from "./LoginButton";
import AttendanceMarking from "./AttendanceMarking";
import "./App.css";

const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Attendance System</h1>
        <LoginButton />
      </header>
      {isAuthenticated && (
        <main style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
          <AttendanceMarking />
        </main>
      )}
    </div>
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
