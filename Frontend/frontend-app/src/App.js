import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import LoginButton from "./LoginButton";
import "./App.css";

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <div className="App">
        <header className="App-header">
          <h1>Online Attendance System</h1>
          <LoginButton />
        </header>
      </div>
    </MsalProvider>
  );
}

export default App;
