import {
  EventAsyncInterface,
  EventClassInterface,
} from '@concepta/nestjs-event';
import {
  InvitationAcceptedEventPayloadInterface,
  InvitationGetUserEventPayloadInterface,
  InvitationGetUserEventResponseInterface,
  UserAuthenticatedEventPayloadInterface,
} from '@concepta/ts-common';

export interface UserSettingsInterface {
  userAuthenticatedRequestEvent?: EventClassInterface<
    EventAsyncInterface<UserAuthenticatedEventPayloadInterface, boolean>
  >;
  invitationRequestEvent?: EventClassInterface<
    EventAsyncInterface<InvitationAcceptedEventPayloadInterface, boolean>
  >;
  invitationGetUserEvent?: EventClassInterface<
    EventAsyncInterface<
      InvitationGetUserEventPayloadInterface,
      InvitationGetUserEventResponseInterface
    >
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
