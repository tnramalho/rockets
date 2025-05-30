import { Module } from '@nestjs/common';

import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';

import { OtpEntitiesOptionsInterface } from '../interfaces/otp-entities-options.interface';
import { OtpModule } from '../otp.module';

import { UserEntityFixture } from './entities/user-entity.fixture';
import { UserOtpEntityFixture } from './entities/user-otp-entity.fixture';

@Module({
  imports: [
    TypeOrmExtModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [UserEntityFixture, UserOtpEntityFixture],
    }),
    OtpModule.registerAsync({
      imports: [
        TypeOrmExtModule.forFeature<OtpEntitiesOptionsInterface>({
          userOtp: {
            entity: UserOtpEntityFixture,
          },
        }),
      ],
      useFactory: () => ({}),
      entities: ['userOtp'],
    }),
  ],
})
export class AppModuleFixture {}
