import { TypeOrmExtEntityOptionInterface } from '@concepta/nestjs-typeorm-ext';
import {
  UserEntityInterface,
  UserProfileEntityInterface,
} from '@concepta/nestjs-user';
import { UserEntitiesOptionsInterface } from '@concepta/nestjs-user/dist/interfaces/user-entities-options.interface';
import { UserPasswordHistoryEntityInterface } from '@concepta/nestjs-user/dist/interfaces/user-password-history-entity.interface';

export interface RocketsServerEntitiesOptionsInterface
  extends UserEntitiesOptionsInterface {
  entities: {
    user: TypeOrmExtEntityOptionInterface<UserEntityInterface>;
    userPasswordHistory?: TypeOrmExtEntityOptionInterface<UserPasswordHistoryEntityInterface>;
    userProfile?: TypeOrmExtEntityOptionInterface<UserProfileEntityInterface>;
    userOtp: TypeOrmExtEntityOptionInterface;
  };
}
