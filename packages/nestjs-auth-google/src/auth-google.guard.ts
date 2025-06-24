import { Injectable } from '@nestjs/common';

import { AuthGuard } from '@concepta/nestjs-authentication';

import { AUTH_GOOGLE_STRATEGY_NAME } from './auth-google.constants';
import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

@Injectable()
export class AuthGoogleGuard extends AuthGuard(AUTH_GOOGLE_STRATEGY_NAME, {
  canDisable: false,
}) implements AuthGuardInterface {}
