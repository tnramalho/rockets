import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterProviderMissingException extends AuthGuardRouterException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      safeMessage:
        'Auth Guard Router provider is required in the request query parameters.',
      ...options,
    });

    this.errorCode = 'AUTH_GUARD_ROUTER_PROVIDER_MISSING_ERROR';
  }
}
