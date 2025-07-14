import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterConfigNotAvailableException extends AuthGuardRouterException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      safeMessage:
        'Auth Guard Router configuration is not available or invalid.',
      ...options,
    });

    this.errorCode = 'AUTH_GUARD_ROUTER_CONFIG_NOT_AVAILABLE_ERROR';
  }
}
