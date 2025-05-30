import { Injectable } from '@nestjs/common';

import {
  ModelService,
  RepositoryInterface,
  InjectDynamicRepository,
  InvitationEntityInterface,
} from '@concepta/nestjs-common';

import { InvitationCreateDto } from '../dto/invitation-create.dto';
import { InvitationCreatableInterface } from '../interfaces/domain/invitation-creatable.interface';
import { InvitationModelServiceInterface } from '../interfaces/services/invitation-model-service.interface';
import { INVITATION_MODULE_INVITATION_ENTITY_KEY } from '../invitation.constants';

/**
 * Invitation model service
 */
@Injectable()
export class InvitationModelService
  extends ModelService<
    InvitationEntityInterface,
    InvitationCreatableInterface,
    never
  >
  implements InvitationModelServiceInterface
{
  /**
   * Constructor
   *
   * @param repo - instance of the invitation repo
   */
  constructor(
    @InjectDynamicRepository(INVITATION_MODULE_INVITATION_ENTITY_KEY)
    repo: RepositoryInterface<InvitationEntityInterface>,
  ) {
    super(repo);
  }

  protected createDto = InvitationCreateDto;
  protected updateDto!: never;
}
