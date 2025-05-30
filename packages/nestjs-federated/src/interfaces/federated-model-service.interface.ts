import {
  CreateOneInterface,
  ReferenceIdInterface,
  RemoveOneInterface,
  ReplaceOneInterface,
  UpdateOneInterface,
  FederatedCreatableInterface,
  FederatedUpdatableInterface,
  FederatedEntityInterface,
} from '@concepta/nestjs-common';

export interface FederatedModelServiceInterface
  extends CreateOneInterface<
      FederatedCreatableInterface,
      FederatedEntityInterface
    >,
    UpdateOneInterface<FederatedUpdatableInterface, FederatedEntityInterface>,
    ReplaceOneInterface<
      FederatedCreatableInterface & ReferenceIdInterface,
      FederatedEntityInterface
    >,
    RemoveOneInterface<
      Pick<FederatedEntityInterface, 'id'>,
      FederatedEntityInterface
    > {}
