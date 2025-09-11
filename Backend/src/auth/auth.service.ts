import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

// Define a type for the decoded Azure token payload for clarity
interface AzureTokenPayload {
  oid: string;
  email?: string;
  preferred_username?: string;
  name: string;
  upn?: string; // User Principal Name
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // This method is no longer valid as password authentication has been removed.
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async createOrUpdateUserFromAzure(azureUserDto: any): Promise<User> {
    return this.userService.createOrUpdateFromAzure(azureUserDto);
  }

  async validateAndProvisionAzureUser(accessToken: string): Promise<User | null> {
    try {
      // Note: In a production environment, you MUST validate the token signature
      // and issuer against the Azure AD public keys.
      // For this implementation, we are only decoding it.
      const decodedToken = this.jwtService.decode(accessToken) as AzureTokenPayload;

      if (!decodedToken) {
        this.logger.warn('Could not decode Azure access token.');
        return null;
      }

      // Prefer UPN for email, fallback to email or preferred_username
      const email = decodedToken.upn || decodedToken.email || decodedToken.preferred_username;
      if (!email) {
        this.logger.error(
          'Azure token does not contain an email (upn, email, or preferred_username).',
        );
        return null;
      }

      // Extract register_number from user principal name (UPN)
      const userPrincipalName = decodedToken.upn || decodedToken.preferred_username || email;
      let registerNumber = '';
      
      if (userPrincipalName) {
        // Extract everything before '@' as register_number
        registerNumber = userPrincipalName.split('@')[0];
        this.logger.log(`Extracted register_number: ${registerNumber} from UPN: ${userPrincipalName}`);
      }

      const userDto = {
        azureId: decodedToken.oid,
        email: email,
        displayName: decodedToken.name,
        register_number: registerNumber,
      };

      const user = await this.userService.createOrUpdateFromAzure(userDto);
      return user;
    } catch (error) {
      this.logger.error('Error during Azure user provisioning', error);
      return null;
    }
  }
}
