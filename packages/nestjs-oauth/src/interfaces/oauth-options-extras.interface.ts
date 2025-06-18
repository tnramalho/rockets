import { DynamicModule } from '@nestjs/common';

import { OAuthGuardConfigInterface } from './oauth-guard-config.interface';

export interface OAuthOptionsExtrasInterface
  extends Pick<DynamicModule, 'global'> {
  oAuthGuards: OAuthGuardConfigInterface[];
}
