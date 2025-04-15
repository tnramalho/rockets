import { HttpStatus } from '@nestjs/common';
import { RuntimeExceptionOptions } from '@concepta/nestjs-common';
import { PasswordException } from './password.exception';

export class PasswordRequiredException extends PasswordException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      message: 'Password is required for hashing, but non was provided.',
      httpStatus: HttpStatus.BAD_REQUEST,
      ...options,
    });

    this.errorCode = 'PASSWORD_REQUIRED_ERROR';
  }
}
