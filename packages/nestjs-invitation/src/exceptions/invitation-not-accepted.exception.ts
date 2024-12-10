import { RuntimeExceptionOptions } from '@concepta/nestjs-exception';
import { HttpStatus } from '@nestjs/common';
import { InvitationException } from './invitation.exception';

/**
 * Generic invitation exception.
 */
export class InvitationNotAcceptedException extends InvitationException {
  constructor(options?: RuntimeExceptionOptions) {
    super({
      ...options,
      httpStatus: HttpStatus.BAD_REQUEST,
    });
    this.errorCode = 'INVITATION_NOT_ACCEPTED_ERROR';
  }
}
