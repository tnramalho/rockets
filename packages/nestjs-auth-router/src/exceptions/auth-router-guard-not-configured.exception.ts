import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthRouterException } from './auth-router.exception';

export class AuthRouterGuardNotConfiguredException extends AuthRouterException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `No guard configured for Auth Router provider '${provider}'.`,
      ...options,
    });

    this.errorCode = 'AUTH_ROUTER_GUARD_NOT_CONFIGURED_ERROR';
  }
}
