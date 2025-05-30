import { InvitationAcceptedEventPayloadInterface } from '@concepta/nestjs-common';
import {
  EventAsyncInterface,
  EventClassInterface,
} from '@concepta/nestjs-event';

export interface OrgSettingsInterface {
  invitationRequestEvent?: EventClassInterface<
    EventAsyncInterface<InvitationAcceptedEventPayloadInterface, boolean>
  >;
}
