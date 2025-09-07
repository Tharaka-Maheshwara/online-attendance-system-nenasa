import React from "react";
import { useMsal } from "@azure/msal-react";

function LoginButton() {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ["User.Read"],
    });
  };

  const handleLogout = () => {
    instance.logoutPopup();
  };

  const isAuthenticated = accounts.length > 0;

  return (
    <div>
      {!isAuthenticated ? (
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#0078d4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Login with Microsoft
        </button>
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
