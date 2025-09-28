// Authentication utility functions
import { msalInstance } from '../App';

export const getAccessToken = async () => {
  const accounts = msalInstance.getAllAccounts();
  
  if (!accounts || accounts.length === 0) {
    throw new Error("No account found");
  }

  const request = {
    scopes: ["openid", "profile", "User.Read"],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    console.error("Silent token acquisition failed:", error);
    // Fallback to popup
    const response = await msalInstance.acquireTokenPopup(request);
    return response.accessToken;
  }
};