import { Injectable } from '@nestjs/common';

import {
  ModelService,
  RepositoryInterface,
  FederatedCreatableInterface,
  FederatedUpdatableInterface,
  InjectDynamicRepository,
  FederatedEntityInterface,
} from '@concepta/nestjs-common';

import { FederatedCreateDto } from '../dto/federated-create.dto';
import { FederatedUpdateDto } from '../dto/federated-update.dto';
import { FEDERATED_MODULE_FEDERATED_ENTITY_KEY } from '../federated.constants';
import { FederatedModelServiceInterface } from '../interfaces/federated-model-service.interface';

/**
 * Federated model service
 */
@Injectable()
export class FederatedModelService
  extends ModelService<
    FederatedEntityInterface,
    FederatedCreatableInterface,
    FederatedUpdatableInterface
  >
  implements FederatedModelServiceInterface
{
  protected createDto = FederatedCreateDto;
  protected updateDto = FederatedUpdateDto;

  /**
   * Constructor
   *
   * @param repo - instance of the federated repo
   */
  constructor(
    @InjectDynamicRepository(FEDERATED_MODULE_FEDERATED_ENTITY_KEY)
    repo: RepositoryInterface<FederatedEntityInterface>,
  ) {
    super(repo);
  }
}
