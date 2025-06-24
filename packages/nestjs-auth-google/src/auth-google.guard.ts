import { Injectable } from '@nestjs/common';

import { AuthGuard } from '@concepta/nestjs-authentication';
import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

import { AUTH_GOOGLE_STRATEGY_NAME } from './auth-google.constants';

@Injectable()
export class AuthGoogleGuard
  extends AuthGuard(AUTH_GOOGLE_STRATEGY_NAME, {
    canDisable: false,
  })
  implements AuthGuardInterface {}
