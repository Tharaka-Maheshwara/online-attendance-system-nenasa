// Tenant Information Helper
export const tenantInfo = {
  tenantId: "a7a43c95-55b0-4d14-98c5-a7478dfb87d3",
  clientId: "9a2a5624-5ed7-4449-b2b0-e1862e68fdcc",
  organizationName: "Nenasala Higher Education",
  
  // Common domains for this tenant
  expectedDomains: [
    "@nenasa.edu.lk", // Custom domain for NENASA
    "@yourdomain.onmicrosoft.com", // Replace with your actual domain
    "@yourdomain.com" // If you have a custom domain
  ],
  
  // Check if email belongs to this tenant
  isValidTenantEmail: (email) => {
    if (!email) return false;
    
    return tenantInfo.expectedDomains.some(domain => 
      email.toLowerCase().endsWith(domain.toLowerCase())
    );
  },
  
  // Get tenant login URL
  getTenantLoginUrl: () => {
    return `https://login.microsoftonline.com/${tenantInfo.tenantId}`;
  },
  
  // Get Azure portal URL for this tenant
  getAzurePortalUrl: () => {
    return `https://portal.azure.com/#@${tenantInfo.tenantId}`;
  }
};

// Instructions for adding users
export const userManagementInstructions = {
  addInternalUser: [
    "1. Go to https://portal.azure.com",
    "2. Navigate to Azure Active Directory",
    "3. Click Users → All users → + New user → Create user",
    "4. Fill in user details with @yourdomain.onmicrosoft.com email",
    "5. Assign appropriate licenses and groups"
  ],
  
  addExternalUser: [
    "1. Go to https://portal.azure.com",
    "2. Navigate to Azure Active Directory", 
    "3. Click Users → All users → + New user → Invite external user",
    "4. Enter external email address",
    "5. Send invitation"
  ],
  
  checkAppRegistration: [
    "1. Go to Azure Active Directory → App registrations",
    "2. Find your app (9a2a5624-5ed7-4449-b2b0-e1862e68fdcc)",
    "3. Check Authentication → Supported account types",
    "4. Verify Redirect URIs include http://localhost:3000/",
    "5. Check API permissions"
  ]
};
