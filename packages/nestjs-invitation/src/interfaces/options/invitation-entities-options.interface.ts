import {
  InvitationEntityInterface,
  RepositoryEntityOptionInterface,
} from '@concepta/nestjs-common';

import { INVITATION_MODULE_INVITATION_ENTITY_KEY } from '../../invitation.constants';

export interface InvitationEntitiesOptionsInterface {
  [INVITATION_MODULE_INVITATION_ENTITY_KEY]: RepositoryEntityOptionInterface<InvitationEntityInterface>;
}
