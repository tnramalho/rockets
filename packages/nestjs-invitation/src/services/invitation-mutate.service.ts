import { InjectDynamicRepository } from '@concepta/nestjs-typeorm-ext';
import { MutateService } from '@concepta/typeorm-common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { InvitationCreateDto } from '../dto/invitation-create.dto';

import { InvitationMutateCreateDto } from '../dto/invitation-mutate-create.dto';
import { InvitationCreatableInterface } from '../interfaces/invitation-creatable.interface';
import { InvitationMutateCreateInterface } from '../interfaces/invitation-mutate-create.interface';
import { InvitationMutateServiceInterface } from '../interfaces/invitation-mutate-service.interface';
import { InvitationEntityInterface } from '../interfaces/invitation.entity.interface';
import { INVITATION_MODULE_INVITATION_ENTITY_KEY } from '../invitation.constants';

/**
 * Invitation mutate service
 */
@Injectable()
export class InvitationMutateService
  extends MutateService<
    InvitationEntityInterface,
    InvitationMutateCreateInterface,
    InvitationCreatableInterface
  >
  implements InvitationMutateServiceInterface
{
  protected createDto = InvitationMutateCreateDto;
  protected updateDto = InvitationCreateDto;

  /**
   * Constructor
   *
   * @param repo - instance of the invitation repo
   */
  constructor(
    @InjectDynamicRepository(INVITATION_MODULE_INVITATION_ENTITY_KEY)
    repo: Repository<InvitationEntityInterface>,
  ) {
    super(repo);
  }
}
