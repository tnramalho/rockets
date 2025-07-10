import { DynamicModule } from '@nestjs/common';

import { AuthGuardRouterGuardConfigInterface } from './auth-guard-router-guard-config.interface';

export interface AuthGuardRouterOptionsExtrasInterface
  extends Pick<DynamicModule, 'global'> {
  guards: AuthGuardRouterGuardConfigInterface[];
}
