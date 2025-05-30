import { DataSourceOptions } from 'typeorm';

import { UserPasswordHistoryEntityFixture } from './user-password-history.entity.fixture';
import { UserProfileEntityFixture } from './user-profile.entity.fixture';
import { UserEntityFixture } from './user.entity.fixture';

export const ormConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  entities: [
    UserEntityFixture,
    UserProfileEntityFixture,
    UserPasswordHistoryEntityFixture,
  ],
};
