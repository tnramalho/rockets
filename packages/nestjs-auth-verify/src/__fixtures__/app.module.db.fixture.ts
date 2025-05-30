import { Module } from '@nestjs/common';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { CrudModule } from '@concepta/nestjs-crud';
import { EmailModule, EmailService } from '@concepta/nestjs-email';
import { JwtModule } from '@concepta/nestjs-jwt';
import { OtpModule, OtpService } from '@concepta/nestjs-otp';
import { PasswordModule } from '@concepta/nestjs-password';
import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';
import {
  UserModelService,
  UserModelServiceInterface,
  UserModule,
} from '@concepta/nestjs-user';

import { AuthVerifyModule } from '../auth-verify.module';

import { AuthVerifyControllerFixture } from './auth-verify.controller.fixture';
import { MailerServiceFixture } from './email/mailer.service.fixture';
import { default as ormConfig } from './ormconfig.fixture';
import { UserEntityFixture } from './user/entities/user-entity.fixture';
import { UserOtpEntityFixture } from './user/entities/user-otp-entity.fixture';

@Module({
  imports: [
    TypeOrmExtModule.forRoot(ormConfig),
    CrudModule.forRoot({}),
    JwtModule.forRoot({}),
    AuthenticationModule.forRoot({
      settings: {
        disableGuard: (context, guard) =>
          guard.constructor.name === 'AuthJwtGuard' &&
          context.getClass().name === 'UserController',
      },
    }),
    AuthJwtModule.forRootAsync({
      inject: [UserModelService],
      useFactory: (userModelService: UserModelServiceInterface) => ({
        userModelService,
      }),
    }),
    AuthVerifyModule.forRootAsync({
      inject: [UserModelService, OtpService, EmailService],
      useFactory: (userModelService, otpService, emailService) => ({
        userModelService,
        otpService,
        emailService,
      }),
    }),
    OtpModule.forRootAsync({
      useFactory: () => ({}),
      entities: ['userOtp'],
      imports: [
        TypeOrmExtModule.forFeature({
          userOtp: {
            entity: UserOtpEntityFixture,
          },
        }),
      ],
    }),
    PasswordModule.forRoot({}),
    UserModule.forRootAsync({
      imports: [
        TypeOrmExtModule.forFeature({
          user: {
            entity: UserEntityFixture,
          },
        }),
      ],
      useFactory: () => ({}),
    }),
    EmailModule.forRoot({
      mailerService: new MailerServiceFixture(),
    }),
  ],
  controllers: [AuthVerifyControllerFixture],
})
export class AppModuleDbFixture {}
