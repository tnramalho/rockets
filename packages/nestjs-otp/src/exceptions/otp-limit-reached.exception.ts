import { RuntimeExceptionOptions } from '@concepta/nestjs-common';
import { OtpException } from './otp.exception';

export class OtpLimitReachedException extends OtpException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      message: 'OTP creation limit reached for the time window.',
      ...options,
    });

    this.errorCode = 'OTP_LIMIT_REACHED_ERROR';
  }
}
