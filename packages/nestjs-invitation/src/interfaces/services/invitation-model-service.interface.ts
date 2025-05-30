import {
  ByIdInterface,
  CreateOneInterface,
  InvitationEntityInterface,
} from '@concepta/nestjs-common';

import { InvitationCreatableInterface } from '../domain/invitation-creatable.interface';

export interface InvitationModelServiceInterface
  extends ByIdInterface,
    CreateOneInterface<
      InvitationCreatableInterface,
      InvitationEntityInterface
    > {}
