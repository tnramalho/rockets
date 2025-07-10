import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterGuardInvalidException extends AuthGuardRouterException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `Invalid guard configuration for Auth Guard Router provider '${provider}'.`,
      ...options,
    });

    this.errorCode = 'AUTH_AUTH_GUARD_ROUTER_GUARD_INVALID_ERROR';
  }
}
