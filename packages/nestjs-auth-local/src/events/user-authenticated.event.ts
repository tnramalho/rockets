import { EventAsync } from '@concepta/nestjs-event';
import { UserAuthenticatedEventPayloadInterface } from '@concepta/ts-common';

export class UserAuthenticatedEventAsync extends EventAsync<
  UserAuthenticatedEventPayloadInterface,
  boolean
> {}
