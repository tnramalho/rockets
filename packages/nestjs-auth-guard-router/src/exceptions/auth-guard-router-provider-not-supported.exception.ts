import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { AuthGuardRouterException } from './auth-guard-router.exception';

export class AuthGuardRouterProviderNotSupportedException extends AuthGuardRouterException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `Auth Guard Router provider '${provider}' is not supported.`,
      ...options,
    });

    this.errorCode = 'AUTH_GUARD_ROUTER_PROVIDER_NOT_SUPPORTED_ERROR';
  }
}
