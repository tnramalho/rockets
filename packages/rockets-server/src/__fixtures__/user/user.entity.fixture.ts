import { UserSqliteEntity } from '@concepta/nestjs-user';
import { Entity, OneToMany, OneToOne } from 'typeorm';
import { UserProfileEntityFixture } from './user-profile.entity.fixture';
import { UserOtpEntityFixture } from './user-otp-entity.fixture';

@Entity()
export class UserFixture extends UserSqliteEntity {
  @OneToOne(() => UserProfileEntityFixture, (userProfile) => userProfile.user)
  userProfile?: UserProfileEntityFixture;
  @OneToMany(() => UserOtpEntityFixture, (userOtp) => userOtp.assignee)
  userOtps?: UserOtpEntityFixture[];
}
