import { PasswordPlainCurrentInterface } from '../../password/interfaces/password-plain-current.interface';
import { UserCreatableInterface } from './user-creatable.interface';
import { UserInterface } from './user.interface';

export interface UserUpdatableInterface
  extends Partial<
      Pick<UserInterface, 'email' | 'active' | 'lastLogin'>
    >,
    Partial<Pick<UserCreatableInterface, 'password'>>,
    Partial<PasswordPlainCurrentInterface> {}
