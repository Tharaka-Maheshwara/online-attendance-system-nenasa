import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Mock user for testing
    request.user = {
      userId: 'test-user-id',
      username: 'test@example.com',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['teacher'],
    };

    return true;
  }
}
