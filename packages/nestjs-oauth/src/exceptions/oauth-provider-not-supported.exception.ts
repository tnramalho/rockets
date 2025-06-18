import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthProviderNotSupportedException extends OAuthException {
  constructor(provider: string, options?: RuntimeExceptionOptions) {
    super({
      safeMessage: `OAuth provider '${provider}' is not supported.`,
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_PROVIDER_NOT_SUPPORTED_ERROR';
  }
}
