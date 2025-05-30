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
import { UserModule } from '../user.module';
import { UserResource } from '../user.types';

import { createUserRepositoryFixture } from './create-user-repository.fixture';
import { ormConfig } from './ormconfig.fixture';
import { UserModelCustomService } from './services/user-model.custom.service';
import { UserEntityFixture } from './user.entity.fixture';
import { UserModuleCustomFixture } from './user.module.custom.fixture';

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
    UserModuleCustomFixture,
    TypeOrmExtModule.forRoot(ormConfig),
    EventModule.forRoot({}),
    JwtModule.forRoot({}),
    AuthJwtModule.forRootAsync({
      inject: [UserModelCustomService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthenticationModule.forRoot({}),
    PasswordModule.forRoot({}),
    AccessControlModule.forRoot({ settings: { rules } }),
    UserModule.forRootAsync({
      imports: [
        TypeOrmExtModule.forFeature({
          user: {
            entity: UserEntityFixture,
            repositoryFactory: createUserRepositoryFixture,
          },
        }),
      ],
      inject: [UserModelCustomService],
      useFactory: async (userModelService: UserModelServiceInterface) => ({
        userModelService,
        settings: {
          passwordHistory: {
            enabled: true,
          },
        },
      }),
    }),
  ],
})
export class AppModuleCustomFixture {}
