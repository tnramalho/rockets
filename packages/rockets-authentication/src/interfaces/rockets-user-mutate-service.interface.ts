import {
  ReferenceActiveInterface,
  ReferenceEmailInterface,
  ReferenceIdInterface,
  UpdateOneInterface,
} from '@concepta/nestjs-common';
import { PasswordPlainInterface } from '@concepta/nestjs-common';
import { QueryOptionsInterface } from '@concepta/typeorm-common';

export interface RocketsUserMutateServiceInterface
  extends UpdateOneInterface<
    ReferenceIdInterface & PasswordPlainInterface & ReferenceActiveInterface,
    ReferenceIdInterface & ReferenceEmailInterface & ReferenceActiveInterface,
    QueryOptionsInterface
  > {}