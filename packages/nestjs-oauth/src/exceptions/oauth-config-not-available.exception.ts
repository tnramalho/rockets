import { RuntimeExceptionOptions } from '@concepta/nestjs-common';

import { OAuthException } from './oauth.exception';

export class OAuthConfigNotAvailableException extends OAuthException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      safeMessage: 'OAuth configuration is not available or invalid.',
      ...options,
    });

    this.errorCode = 'AUTH_OAUTH_CONFIG_NOT_AVAILABLE_ERROR';
  }
}
