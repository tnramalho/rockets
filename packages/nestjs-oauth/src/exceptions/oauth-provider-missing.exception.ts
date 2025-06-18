import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthProviderMissingException extends OAuthException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      safeMessage:
        'OAuth provider is required in the request query parameters.',
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_PROVIDER_MISSING_ERROR';
  }
}
