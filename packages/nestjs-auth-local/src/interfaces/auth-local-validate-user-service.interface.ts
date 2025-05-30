import { ValidateUserServiceInterface } from '@concepta/nestjs-authentication';
import { ReferenceIdInterface } from '@concepta/nestjs-common';

import { AuthLocalValidateUserInterface } from './auth-local-validate-user.interface';

export interface AuthLocalValidateUserServiceInterface
  extends ValidateUserServiceInterface<[AuthLocalValidateUserInterface]> {
  validateUser: (
    dto: AuthLocalValidateUserInterface,
  ) => Promise<ReferenceIdInterface>;
}
