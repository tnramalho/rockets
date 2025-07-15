import { DynamicModule } from '@nestjs/common';

import { AuthRouterGuardConfigInterface } from './auth-router-guard-config.interface';

export interface AuthRouterOptionsExtrasInterface
  extends Pick<DynamicModule, 'global'> {
  guards: AuthRouterGuardConfigInterface[];
}
