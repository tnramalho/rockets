import {
  RuntimeException,
  RuntimeExceptionOptions,
} from '@concepta/nestjs-exception';
import { HttpStatus } from '@nestjs/common';
export class FederatedUserRelationshipException extends RuntimeException {
  context: RuntimeException['context'] & {
    federatedId: string;
  };

  constructor(federatedId: string, options?: RuntimeExceptionOptions) {
    super({
      message: 'Error while trying to load user relationship from federated %s',
      messageParams: [federatedId],
      httpStatus: HttpStatus.NOT_FOUND,
      ...options,
    });

    this.errorCode = 'FEDERATED_USER_RELATIONSHIP_ERROR';

    this.context = {
      ...super.context,
      federatedId,
    };
  }
}
