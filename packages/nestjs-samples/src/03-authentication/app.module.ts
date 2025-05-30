import { Module } from '@nestjs/common';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthLocalModule } from '@concepta/nestjs-auth-local';
import { AuthRefreshModule } from '@concepta/nestjs-auth-refresh';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { CrudModule } from '@concepta/nestjs-crud';
import { JwtModule } from '@concepta/nestjs-jwt';
import { PasswordModule } from '@concepta/nestjs-password';
import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';
import {
  UserModule,
  UserModelServiceInterface,
  UserModelService,
} from '@concepta/nestjs-user';

import { createUserRepository } from './user/create-user-repository';
import { CustomUserController } from './user/user.controller';
import { UserEntity } from './user/user.entity';

@Module({
  imports: [
    TypeOrmExtModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [UserEntity],
    }),
    AuthLocalModule.registerAsync({
      inject: [UserModelService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthJwtModule.registerAsync({
      inject: [UserModelService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthRefreshModule.registerAsync({
      inject: [UserModelService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthenticationModule.forRoot({}),
    JwtModule.forRoot({}),
    PasswordModule.forRoot({}),
    CrudModule.forRoot({}),
    UserModule.forRootAsync({
      imports: [
        TypeOrmExtModule.forFeature({
          user: {
            entity: UserEntity,
            repositoryFactory: createUserRepository,
          },
        }),
      ],
      useFactory: () => ({}),
    }),
  ],
  controllers: [CustomUserController],
  exports: [AuthenticationModule, AuthRefreshModule, AuthLocalModule],
})
export class AppModule {}
