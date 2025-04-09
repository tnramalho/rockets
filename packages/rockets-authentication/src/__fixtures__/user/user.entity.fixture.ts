import { UserSqliteEntity } from '@concepta/nestjs-user';
import { Entity, OneToOne } from 'typeorm';
import { UserProfileEntityFixture } from './user-profile.entity.fixture';

@Entity()
export class UserFixture extends UserSqliteEntity {
  @OneToOne(() => UserProfileEntityFixture, (userProfile) => userProfile.user)
  userProfile?: UserProfileEntityFixture;
}
