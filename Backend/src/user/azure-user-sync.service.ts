import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { UserService } from './user.service';

@Injectable()
export class AzureUserSyncService {
  private readonly logger = new Logger(AzureUserSyncService.name);
  private graphClient: Client;

  constructor(private readonly userService: UserService) {
    this.initializeGraphClient();
  }

  private initializeGraphClient() {
    const tenantId = process.env.AZURE_TENANT_ID || 'a7a43c95-55b0-4d14-98c5-a7478dfb87d3';
    const clientId = process.env.AZURE_CLIENT_ID || '9a2a5624-5ed7-4449-b2b0-e1862e68fdcc';
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientSecret) {
      this.logger.warn('Azure client secret not configured. Azure sync functionality will be disabled.');
      return;
    }

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          try {
            const token = await credential.getToken('https://graph.microsoft.com/.default');
            return token.token;
          } catch (error) {
            this.logger.error('Failed to get access token:', error);
            throw error;
          }
        },
      },
    });
  }

  async syncAzureUsersToDb() {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized. Check Azure credentials.');
    }

    try {
      this.logger.log('Starting Azure AD user sync...');
      
      // Fetch users from Azure AD
      const users = await this.graphClient.api('/users').get();
      
      this.logger.log(`Found ${users.value.length} users in Azure AD`);
      
      let syncedCount = 0;
      let errorCount = 0;

      for (const user of users.value) {
        try {
          // Skip users without email
          if (!user.mail && !user.userPrincipalName) {
            this.logger.warn(`Skipping user ${user.displayName} - no email found`);
            continue;
          }

          // Save user info to your DB using your UserService
          await this.userService.createOrUpdateFromAzure({
            email: user.mail || user.userPrincipalName,
            displayName: user.displayName,
            azureId: user.id,
          });

          syncedCount++;
          this.logger.log(`Synced user: ${user.displayName} (${user.mail || user.userPrincipalName})`);
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to sync user ${user.displayName}:`, error);
        }
      }

      this.logger.log(`Azure AD sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
      
      return { 
        totalUsers: users.value.length, 
        syncedUsers: syncedCount, 
        errors: errorCount 
      };
    } catch (error) {
      this.logger.error('Failed to sync Azure AD users:', error);
      throw error;
    }
  }

  async getAzureUserById(azureId: string) {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized. Check Azure credentials.');
    }

    try {
      const user = await this.graphClient.api(`/users/${azureId}`).get();
      return user;
    } catch (error) {
      this.logger.error(`Failed to fetch Azure user ${azureId}:`, error);
      throw error;
    }
  }

  async getAzureUserByEmail(email: string) {
    if (!this.graphClient) {
      throw new Error('Graph client not initialized. Check Azure credentials.');
    }

    try {
      const users = await this.graphClient
        .api('/users')
        .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
        .get();
      
      return users.value.length > 0 ? users.value[0] : null;
    } catch (error) {
      this.logger.error(`Failed to fetch Azure user by email ${email}:`, error);
      throw error;
    }
  }
}
