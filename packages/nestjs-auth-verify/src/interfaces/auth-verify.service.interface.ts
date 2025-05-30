import { ReferenceIdInterface } from '@concepta/nestjs-common';

import { AuthVerifyConfirmParamsInterface } from './auth-verify-confirm-params.interface';
import { AuthVerifyRevokeParamsInterface } from './auth-verify-revoke-params.interface';
import { AuthVerifySendParamsInterface } from './auth-verify-send-params.interface';

export interface AuthVerifyServiceInterface {
  send(params: AuthVerifySendParamsInterface): Promise<void>;
  confirmUser(
    params: AuthVerifyConfirmParamsInterface,
  ): Promise<ReferenceIdInterface | null>;
  revokeAllUserVerifyToken(
    params: AuthVerifyRevokeParamsInterface,
  ): Promise<void>;
}
