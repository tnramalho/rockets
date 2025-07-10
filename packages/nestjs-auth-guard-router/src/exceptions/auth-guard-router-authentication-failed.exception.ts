import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterAuthenticationFailedException extends AuthGuardRouterException {
  constructor(
    provider: string,
    errorMessage: string,
    options?: RuntimeExceptionOptions,
  ) {
    super({
      safeMessage: `Auth Guard Router authentication failed for provider '${provider}': ${errorMessage}`,
      ...options,
    });

    this.errorCode = 'AUTH_AUTH_GUARD_ROUTER_AUTHENTICATION_FAILED_ERROR';
  }
}
