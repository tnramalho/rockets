import {
  EventAsyncInterface,
  EventListenerOn,
  EventListenService,
} from '@concepta/nestjs-event';
import {
  INVITATION_MODULE_CATEGORY_USER_KEY,
  UserAuthenticatedEventPayloadInterface,
} from '@concepta/ts-common';
import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common';

import { USER_MODULE_SETTINGS_TOKEN } from '../user.constants';
import { UserMutateService } from '../services/user-mutate.service';
import { UserSettingsInterface } from '../interfaces/user-settings.interface';
import { UserLookupService } from '../services/user-lookup.service';
import { UserNotFoundException } from '../exceptions/user-not-found-exception';
import { UserException } from '../exceptions/user-exception';

@Injectable()
export class UserAuthenticatedListener
  extends EventListenerOn<
    EventAsyncInterface<UserAuthenticatedEventPayloadInterface, boolean>
  >
  implements OnModuleInit
{
  constructor(
    @Inject(USER_MODULE_SETTINGS_TOKEN)
    private settings: UserSettingsInterface,
    private userLookupService: UserLookupService,
    private userMutateService: UserMutateService,
    @Optional()
    @Inject(EventListenService)
    private eventListenService?: EventListenService,
  ) {
    super();
  }

  onModuleInit() {
    if (this.eventListenService && this.settings.userAuthenticatedRequestEvent) {
      this.eventListenService.on(this.settings.userAuthenticatedRequestEvent, this);
    }
  }

  async listen(
    event: EventAsyncInterface<
      UserAuthenticatedEventPayloadInterface,
      boolean
    >,
  ) {
    // check only for user id exists
    if (event?.payload?.user?.id) {
      const userId = event?.payload?.user?.id;

      if (typeof userId !== 'string') {
        throw new UserException({
          message:
            'The user authenticated event payload received has invalid content. The payload must have the "id" properties.',
        });
      }

      const user = await this.userLookupService.byId(
        userId,
        event.payload?.queryOptions,
      );

      if (!user) {
        throw new UserNotFoundException();
      }

      await this.userMutateService.update(
        { ...user, lastLogin: new Date() },
        event.payload?.queryOptions,
      );

      return true;
    }

    // return true by default
    return true;
  }
}
