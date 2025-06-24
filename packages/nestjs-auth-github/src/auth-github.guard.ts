import { Injectable } from '@nestjs/common';

import { AuthGuard, AuthGuardInterface } from '@concepta/nestjs-authentication';

import { AUTH_GITHUB_STRATEGY_NAME } from './auth-github.constants';

@Injectable()
export class AuthGithubGuard
  extends AuthGuard(AUTH_GITHUB_STRATEGY_NAME, {
    canDisable: false,
  })
  implements AuthGuardInterface {}
