import { Observable } from 'rxjs';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class OAuthFixtureGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    // Attach a mock user to the request for testing
    request.user = {
      id: 'fixture-user-allow',
      username: 'fixture-allow',
      email: 'fixture-allow@test.com',
      provider: 'google',
      roles: ['user'],
      isActive: true,
    };

    return true;
  }
}
