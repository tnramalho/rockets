import {
  CreateOneInterface,
  ReferenceIdInterface,
  RemoveOneInterface,
  ReplaceOneInterface,
  UpdateOneInterface,
  UserCreatableInterface,
  UserUpdatableInterface,
} from '@concepta/nestjs-common';
import { UserEntityInterface } from '@concepta/nestjs-user';
import { QueryOptionsInterface } from '@concepta/typeorm-common';

export interface RocketsServerUserMutateServiceInterface
  extends CreateOneInterface<UserCreatableInterface, UserEntityInterface>,
    UpdateOneInterface<
      UserUpdatableInterface & ReferenceIdInterface,
      UserEntityInterface,
      QueryOptionsInterface
    >,
    ReplaceOneInterface<
      UserCreatableInterface & ReferenceIdInterface,
      UserEntityInterface,
      QueryOptionsInterface
    >,
    RemoveOneInterface<
      UserEntityInterface,
      UserEntityInterface,
      QueryOptionsInterface
    > {
  // update(
  //   object: ReferenceIdInterface & UserUpdatableInterface,
  //   options?: QueryOptionsInterface,
  // ): Promise<
  //   ReferenceIdInterface & ReferenceEmailInterface & ReferenceActiveInterface
  // >;
  // update(
  //   object: ReferenceIdInterface & UserUpdatableInterface,
  //   options?: QueryOptionsInterface,
  // ): Promise<
  //   ReferenceIdInterface & ReferenceEmailInterface & ReferenceActiveInterface
  // >;
}
