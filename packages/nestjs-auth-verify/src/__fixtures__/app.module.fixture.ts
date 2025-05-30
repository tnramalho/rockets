import { Module } from '@nestjs/common';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { EmailModule, EmailService } from '@concepta/nestjs-email';
import { JwtModule } from '@concepta/nestjs-jwt';

import { AuthVerifyModule } from '../auth-verify.module';

import { MailerServiceFixture } from './email/mailer.service.fixture';
import { OtpModuleFixture } from './otp/otp.module.fixture';
import { OtpServiceFixture } from './otp/otp.service.fixture';
import { UserModelServiceFixture } from './user/services/user-model.service.fixture';
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
    AuthVerifyModule.forRootAsync({
      inject: [EmailService, OtpServiceFixture, UserModelServiceFixture],
      useFactory: (emailService, otpService, userModelService) => ({
        emailService,
        otpService,
        userModelService,
      }),
    }),
    EmailModule.forRoot({ mailerService: new MailerServiceFixture() }),
    OtpModuleFixture,
    UserModuleFixture,
  ],
})
export class AppModuleFixture {}
