import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';

// Define a type for the decoded Azure token payload for clarity
interface AzureTokenPayload {
  oid: string;
  email?: string;
  preferred_username?: string;
  name: string;
  given_name?: string;
  family_name?: string;
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
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: pwd, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.email || user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
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

      const userDto = {
        azureId: decodedToken.oid,
        email: email,
        displayName: decodedToken.name,
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name,
        userPrincipalName: decodedToken.upn || email,
      };

      const user = await this.userService.createOrUpdateFromAzure(userDto);
      return user;
    } catch (error) {
      this.logger.error('Error during Azure user provisioning', error);
      return null;
    }
  }
}
