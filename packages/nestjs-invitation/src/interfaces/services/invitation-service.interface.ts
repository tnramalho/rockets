import { InvitationInterface } from '@concepta/nestjs-common';

import { InvitationCreateInviteInterface } from '../domain/invitation-create-invite.interface';
import { InvitationAcceptOptionsInterface } from '../options/invitation-accept-options.interface';
import { InvitationRevokeOptionsInterface } from '../options/invitation-revoke-options.interface';

export interface InvitationServiceInterface {
  create(
    createInviteDto: InvitationCreateInviteInterface,
  ): Promise<Required<Pick<InvitationInterface, 'id' | 'userId'>>>;

  send(invitation: Pick<InvitationInterface, 'id'>): Promise<void>;

  accept(options: InvitationAcceptOptionsInterface): Promise<boolean>;

  revokeAll(options: InvitationRevokeOptionsInterface): Promise<void>;
}
