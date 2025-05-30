import { AccessControl } from 'accesscontrol';

import { Module } from '@nestjs/common';

import { AccessControlModule } from '@concepta/nestjs-access-control';
import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { EventModule } from '@concepta/nestjs-event';
import { JwtModule } from '@concepta/nestjs-jwt';
import { PasswordModule } from '@concepta/nestjs-password';
import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';

import { UserModelServiceInterface } from '../interfaces/user-model-service.interface';
import { UserAccessQueryService } from '../services/user-access-query.service';
import { UserModelService } from '../services/user-model.service';
import { UserModule } from '../user.module';
import { UserResource } from '../user.types';

import { InvitationAcceptedEventAsync } from './events/invitation-accepted.event';
import { ormConfig } from './ormconfig.fixture';
import { UserPasswordHistoryEntityFixture } from './user-password-history.entity.fixture';
import { UserEntityFixture } from './user.entity.fixture';

const rules = new AccessControl();
rules
  .grant('user')
  .resource(UserResource.One)
  .createOwn()
  .readOwn()
  .updateOwn()
  .deleteOwn();

@Module({
  imports: [
    TypeOrmExtModule.forRoot(ormConfig),
    EventModule.forRoot({}),
    JwtModule.forRoot({}),
    AuthJwtModule.forRootAsync({
      inject: [UserModelService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthenticationModule.forRoot({}),
    PasswordModule.forRoot({}),
    AccessControlModule.forRoot({
      settings: { rules },
      queryServices: [UserAccessQueryService],
    }),
    UserModule.forRootAsync({
      imports: [
        TypeOrmExtModule.forFeature({
          user: {
            entity: UserEntityFixture,
          },
          'user-password-history': {
            entity: UserPasswordHistoryEntityFixture,
          },
        }),
      ],
      useFactory: () => ({
        settings: {
          invitationAcceptedEvent: InvitationAcceptedEventAsync,
          passwordHistory: {
            enabled: true,
            limitDays: 99,
          },
        },
      }),
    }),
  ],
})
export class AppModuleFixture {}
