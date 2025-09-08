export const msalConfig = {
  auth: {
    clientId: "9a2a5624-5ed7-4449-b2b0-e1862e68fdcc",
    authority:
      "https://login.microsoftonline.com/a7a43c95-55b0-4d14-98c5-a7478dfb87d3",
    redirectUri: "http://localhost:3000/",
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case "Error":
            console.error(message);
            return;
          case "Info":
            console.info(message);
            return;
          case "Verbose":
            console.debug(message);
            return;
          case "Warning":
            console.warn(message);
            return;
        }
      }
    }
  }
};

// Utility function to clear MSAL cache
export const clearMsalCache = () => {
  sessionStorage.clear();
  localStorage.clear();
  console.log("MSAL cache cleared");
};
