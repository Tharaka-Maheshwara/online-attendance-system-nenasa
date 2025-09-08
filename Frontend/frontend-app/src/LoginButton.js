import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { clearMsalCache } from "./authConfig";
import { tenantInfo, userManagementInstructions } from "./tenantInfo";

function LoginButton() {
  const { instance, accounts, inProgress } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    // Check if any interaction is already in progress
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
      // Handle specific MSAL errors
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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
        <h3>Tenant Information</h3>
        <p><strong>Tenant ID:</strong> {tenantInfo.tenantId}</p>
        <p><strong>Client ID:</strong> {tenantInfo.clientId}</p>
        <p><strong>Azure Portal:</strong> <a href={tenantInfo.getAzurePortalUrl()} target="_blank" rel="noopener noreferrer">Open Azure Portal</a></p>
        
        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontWeight: "bold" }}>📋 How to Add Users to Tenant</summary>
          <div style={{ marginTop: "10px" }}>
            <h4>Add Internal User:</h4>
            <ol>
              {userManagementInstructions.addInternalUser.map((step, index) => (
                <li key={index} style={{ margin: "5px 0" }}>{step}</li>
              ))}
            </ol>
            
            <h4>Add External User (Guest):</h4>
            <ol>
              {userManagementInstructions.addExternalUser.map((step, index) => (
                <li key={index} style={{ margin: "5px 0" }}>{step}</li>
              ))}
            </ol>
          </div>
        </details>
      </div>

      {!isAuthenticated ? (
        <div>
          <button
            onClick={handleLogin}
            disabled={isDisabled}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: isDisabled ? "#ccc" : "#0078d4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.6 : 1,
              marginRight: "10px"
            }}
          >
            {isLoggingIn ? "Signing in..." : "Login with Microsoft"}
          </button>
          <button
            onClick={handleClearCache}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear Cache
          </button>
        </div>
      ) : (
        <div>
          <p>Welcome, {accounts[0].name}!</p>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#d13438",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default LoginButton;
