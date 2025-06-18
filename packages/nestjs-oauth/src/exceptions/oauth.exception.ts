import {
  RuntimeException,
  RuntimeExceptionOptions,
} from '@concepta/nestjs-common';
/**
 * Generic auth google exception.
 */
export class OAuthException extends RuntimeException {
  constructor(options?: RuntimeExceptionOptions) {
    super(options);
    this.errorCode = 'AUTH_OAUTH_ERROR';
  }
}
