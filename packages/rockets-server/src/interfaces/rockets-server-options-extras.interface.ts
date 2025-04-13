import { DynamicModule } from '@nestjs/common';
import { RocketsServerEntitiesOptionsInterface } from './rockets-server-entities-options.interface';

export interface RocketsServerOptionsExtrasInterface
  extends Pick<DynamicModule, 'global' | 'controllers'>,
    Partial<RocketsServerEntitiesOptionsInterface> {}
