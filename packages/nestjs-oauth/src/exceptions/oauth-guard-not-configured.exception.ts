import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthGuardNotConfiguredException extends OAuthException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `No guard configured for OAuth provider '${provider}'.`,
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_GUARD_NOT_CONFIGURED_ERROR';
  }
}
