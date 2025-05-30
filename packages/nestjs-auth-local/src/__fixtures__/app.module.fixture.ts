import { Module } from '@nestjs/common';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { JwtModule } from '@concepta/nestjs-jwt';

// import { default as ormConfig } from './ormconfig.fixture';
import { AuthLocalModule } from '../auth-local.module';

import { UserModelServiceFixture } from './user/user-model.service.fixture';
import { UserModuleFixture } from './user/user.module.fixture';

@Module({
  imports: [
    JwtModule.forRoot({}),
    AuthenticationModule.forRoot({}),
    AuthJwtModule.forRootAsync({
      inject: [UserModelServiceFixture],
      useFactory: (userModelService: UserModelServiceFixture) => ({
        userModelService,
      }),
    }),
    AuthLocalModule.forRootAsync({
      inject: [UserModelServiceFixture],
      useFactory: (userModelService) => ({
        userModelService,
      }),
    }),
    UserModuleFixture,
  ],
})
export class AppModuleDbFixture {}
