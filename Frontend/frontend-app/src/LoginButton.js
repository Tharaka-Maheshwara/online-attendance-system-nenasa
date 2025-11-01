import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { clearMsalCache } from "./authConfig";
import { tenantInfo, userManagementInstructions } from "./tenantInfo";

function LoginButton() {
  const { instance, accounts, inProgress } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (inProgress !== "none" || isLoggingIn) {
      console.log("Authentication already in progress");
      return;
    }

    try {
      setIsLoggingIn(true);
      await instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account"
      });
    } catch (error) {
      console.error("Login failed:", error);
      if (error.name === "BrowserAuthError" && error.errorCode === "user_cancelled") {
        console.log("User cancelled the login");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      // Clear session storage
      sessionStorage.clear();
      // Redirect to home page
      window.location.href = 'http://localhost:3000/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClearCache = () => {
    clearMsalCache();
    window.location.reload();
  };

  const isAuthenticated = accounts.length > 0;
  const isDisabled = inProgress !== "none" || isLoggingIn;

  // Microsoft icon SVG
  const MicrosoftIcon = () => (
    <svg className="microsoft-icon" viewBox="0 0 21 21" fill="currentColor">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="12" y="1" width="9" height="9" fill="#00a4ef"/>
      <rect x="1" y="12" width="9" height="9" fill="#ffb900"/>
      <rect x="12" y="12" width="9" height="9" fill="#7fba00"/>
    </svg>
  );

  return (
    <div className="login-container">
      {!isAuthenticated ? (
        <>
          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Access your {tenantInfo.organizationName || 'NENASA'} account</p>
          <button
            onClick={handleLogin}
            disabled={isDisabled}
            className="microsoft-login-btn"
          >
            <MicrosoftIcon />
            {isLoggingIn ? "Signing in..." : "Login with Microsoft"}
          </button>
        </>
      ) : (
        <div className="user-info">
          <h3>Welcome!</h3>
          <p><strong>{accounts[0].name}</strong></p>
          <p>{accounts[0].username}</p>
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default LoginButton;
