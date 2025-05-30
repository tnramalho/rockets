import { InvitationAcceptedEventPayloadInterface } from '@concepta/nestjs-common';
import {
  EventAsyncInterface,
  EventClassInterface,
} from '@concepta/nestjs-event';

export interface UserSettingsInterface {
  invitationAcceptedEvent?: EventClassInterface<
    EventAsyncInterface<InvitationAcceptedEventPayloadInterface, boolean>
  >;
  passwordHistory?: {
    /**
     * password history feature toggle
     */
    enabled?: boolean;
    /**
     * number of days that password history limitation applies for
     */
    limitDays?: number | undefined;
  };
}
