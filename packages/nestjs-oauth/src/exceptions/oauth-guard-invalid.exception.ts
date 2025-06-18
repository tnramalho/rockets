import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthGuardInvalidException extends OAuthException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `Invalid guard configuration for OAuth provider '${provider}'.`,
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_GUARD_INVALID_ERROR';
  }
}
