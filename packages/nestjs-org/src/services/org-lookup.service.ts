import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ReferenceIdInterface } from '@concepta/ts-core';
import { InjectDynamicRepository } from '@concepta/nestjs-typeorm-ext';
import { LookupService } from '@concepta/typeorm-common';
import {
  ORG_MODULE_ORG_ENTITY_KEY,
  ORG_MODULE_OWNER_LOOKUP_SERVICE,
} from '../org.constants';
import { OrgEntityInterface } from '../interfaces/org-entity.interface';
import { OrgLookupServiceInterface } from '../interfaces/org-lookup-service.interface';
import { OrgOwnerInterface } from '../interfaces/org-owner.interface';
import { OrgOwnerLookupServiceInterface } from '../interfaces/org-owner-lookup-service.interface';

/**
 * Org lookup service
 */
@Injectable()
export class OrgLookupService
  extends LookupService<OrgEntityInterface>
  implements OrgLookupServiceInterface
{
  /**
   * Constructor
   *
   * @param repo instance of the org repo
   */
  constructor(
    @InjectDynamicRepository(ORG_MODULE_ORG_ENTITY_KEY)
    protected repo: Repository<OrgEntityInterface>,
    @Inject(ORG_MODULE_OWNER_LOOKUP_SERVICE)
    private ownerLookupService: OrgOwnerLookupServiceInterface,
  ) {
    super(repo);
  }

  /**
   * Get owner for the given org.
   *
   * @param org The org of which owner to retrieve.
   */
  async getOwner(org: OrgOwnerInterface): Promise<ReferenceIdInterface> {
    return this.ownerLookupService.byId(org.owner.id);
  }
}
