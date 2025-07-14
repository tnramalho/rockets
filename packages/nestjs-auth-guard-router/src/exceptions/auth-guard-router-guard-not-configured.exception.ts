import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterGuardNotConfiguredException extends AuthGuardRouterException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `No guard configured for Auth Guard Router provider '${provider}'.`,
      ...options,
    });

    this.errorCode = 'AUTH_GUARD_ROUTER_GUARD_NOT_CONFIGURED_ERROR';
  }
}
