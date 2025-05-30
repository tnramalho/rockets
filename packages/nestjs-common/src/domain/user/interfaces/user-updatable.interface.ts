import { UserCreatableInterface } from './user-creatable.interface';
import { UserInterface } from './user.interface';

export interface UserUpdatableInterface
  extends Pick<UserInterface, 'id'>,
    Partial<
      Pick<
        UserCreatableInterface,
        'email' | 'active' | 'passwordHash' | 'passwordSalt'
      >
    > {}
