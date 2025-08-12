import { Column, Entity } from 'typeorm';

import { UserProfileEntityInterface } from '@concepta/nestjs-common';
import { UserProfileSqliteEntity } from '@concepta/nestjs-typeorm-ext';

/**
 * User Profile Entity Fixture
 */
@Entity()
export class UserProfileEntityFixture
  extends UserProfileSqliteEntity
  implements UserProfileEntityInterface
{
  @Column({ nullable: true })
  firstName!: string;
}
