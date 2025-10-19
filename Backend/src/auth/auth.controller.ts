import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('azure/login')
  async loginWithAzure(@Body() body: { accessToken: string }) {
    const user = await this.authService.validateAndProvisionAzureUser(
      body.accessToken,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Invalid Azure token or user could not be provisioned.',
      );
    }
    return this.authService.login(user);
  }

  @Post('azure/auto-provision')
  async autoProvisionUser(
    @Body()
    body: {
      userPrincipalName: string;
      displayName: string;
      email: string;
    },
  ) {
    try {
      const { userPrincipalName, displayName, email } = body;

      if (!userPrincipalName) {
        throw new UnauthorizedException('User principal name is required');
      }

      // Extract register_number from user principal name
      const registerNumber = userPrincipalName.split('@')[0];

      this.logger.log(
        `Auto-provisioning user: ${email} with register_number: ${registerNumber}`,
      );

      const userDto = {
        azureId: email, // Using email as temporary azureId since we don't have oid in this context
        email: email,
        displayName: displayName,
        register_number: registerNumber,
      };

      const user = await this.authService.createOrUpdateUserFromAzure(userDto);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          registerNumber: user.register_number,
          role: user.role,
        },
        message: 'User successfully provisioned',
      };
    } catch (error) {
      this.logger.error('Auto-provision failed:', error);

      // If user already exists, that's actually success - just log it
      if (error.message && error.message.includes('Duplicate entry')) {
        this.logger.log(
          `User ${body.email} already exists - this is expected behavior`,
        );
        return {
          success: true,
          message: 'User already exists',
        };
      }

      throw new UnauthorizedException('Failed to provision user');
    }
  }
}
