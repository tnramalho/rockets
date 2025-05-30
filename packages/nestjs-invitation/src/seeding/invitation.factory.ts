import { randomUUID } from 'crypto';

import { faker } from '@faker-js/faker';

import { InvitationEntityInterface } from '@concepta/nestjs-common';
import { Factory } from '@concepta/typeorm-seeding';

export class InvitationFactory extends Factory<InvitationEntityInterface> {
  protected async entity(
    invitation: InvitationEntityInterface,
  ): Promise<InvitationEntityInterface> {
    invitation.code = randomUUID();
    invitation.category = faker.person.jobType();

    return invitation;
  }
}
