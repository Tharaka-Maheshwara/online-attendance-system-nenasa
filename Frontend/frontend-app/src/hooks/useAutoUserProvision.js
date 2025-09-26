import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';

const useAutoUserProvision = () => {
  const { accounts } = useMsal();

  useEffect(() => {
    const provisionUser = async () => {
      if (accounts.length > 0) {
        const account = accounts[0];
        
        try {
          // Extract user information from Azure AD account
          const userPrincipalName = account.username; // This is the UPN
          const displayName = account.name;
          const email = account.username; // In Azure AD, username is typically the email/UPN

          console.log('Auto-provisioning user:', {
            userPrincipalName,
            displayName,
            email
          });

          // Call backend to auto-provision user
          const response = await fetch('http://localhost:8000/auth/azure/auto-provision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userPrincipalName,
              displayName,
              email,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('User auto-provisioned successfully:', result);
            
            // Store user info in session storage for later use
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
          } else {
            const error = await response.text();
            console.error('Failed to auto-provision user:', error);
          }
        } catch (error) {
          console.error('Error during auto-provision:', error);
        }
      }
    };

    // Only provision if user is logged in but not yet provisioned
    if (accounts.length > 0 && !sessionStorage.getItem('currentUser')) {
      provisionUser();
    }
  }, [accounts]);

  return null;
};

export default useAutoUserProvision;
