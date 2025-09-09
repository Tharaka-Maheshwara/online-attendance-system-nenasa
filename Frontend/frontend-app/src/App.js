import React from "react";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import LoginButton from "./LoginButton";
import Dashboard from "./components/Dashboard/Dashboard";
import "./App.css";

const msalInstance = new PublicClientApplication(msalConfig);

function AppContent() {
  const { accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  return (
    <div className="App">
      {!isAuthenticated ? (
        <header className="App-header">
          <h1>Online Attendance System</h1>
          <LoginButton />
        </header>
      ) : (
        <main style={{ padding: '0', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
          <Dashboard />
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
