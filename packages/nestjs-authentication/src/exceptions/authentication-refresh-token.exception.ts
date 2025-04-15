import { HttpStatus } from '@nestjs/common';
import { RuntimeExceptionOptions } from '@concepta/nestjs-common';
import { AuthenticationException } from './authentication.exception';

/**
 * Exception for authentication
 */
export class AuthenticationRefreshTokenException extends AuthenticationException {
  constructor(options?: Omit<RuntimeExceptionOptions, 'httpStatus'>) {
    super({
      message: 'Refresh token was verified, but failed further validation.',
      ...options,
      httpStatus: HttpStatus.UNAUTHORIZED,
    });
    this.errorCode = 'AUTHENTICATION_REFRESH_TOKEN_ERROR';
  }
}
