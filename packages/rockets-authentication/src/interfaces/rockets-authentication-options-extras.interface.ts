import { DynamicModule } from '@nestjs/common';

export interface RocketsAuthenticationOptionsExtrasInterface
  extends Pick<DynamicModule, 'global' | 'controllers'> {}
