import { DynamicModule } from '@nestjs/common';
import { UserEntitiesOptionsInterface } from '@concepta/nestjs-user/dist/interfaces/user-entities-options.interface';

export interface RocketsServerOptionsExtrasInterface
  extends Pick<DynamicModule, 'global' | 'controllers'>,
  Partial<UserEntitiesOptionsInterface> { } 