import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
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
}
