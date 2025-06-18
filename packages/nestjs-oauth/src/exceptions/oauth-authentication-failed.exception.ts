import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthAuthenticationFailedException extends OAuthException {
  constructor(
    provider: string,
    errorMessage: string,
    options?: RuntimeExceptionOptions,
  ) {
    super({
      safeMessage: `OAuth authentication failed for provider '${provider}': ${errorMessage}`,
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_AUTHENTICATION_FAILED_ERROR';
  }
}
