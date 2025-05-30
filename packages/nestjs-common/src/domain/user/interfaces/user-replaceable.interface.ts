import { UserCreatableInterface } from './user-creatable.interface';
import { UserInterface } from './user.interface';

export interface UserReplaceableInterface
  extends Pick<UserInterface, 'id'>,
    UserCreatableInterface {}
