import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';

import { CrudRelationRegistry } from '../../../services/crud-relation.registry';
import { CrudService } from '../../../services/crud.service';
import { UserEntity } from '../users/user.entity';

import { CompanyTypeOrmCrudAdapter } from './company-typeorm-crud.adapter';
import { CompanyEntity } from './company.entity';

@Injectable()
export class CompanyCrudService extends CrudService<
  CompanyEntity,
  [UserEntity]
> {
  constructor(
    crudAdapter: CompanyTypeOrmCrudAdapter,
    @Optional()
    @Inject(forwardRef(() => 'COMPANY_RELATION_REGISTRY'))
    relationRegistry?: CrudRelationRegistry<CompanyEntity, [UserEntity]>,
  ) {
    super(crudAdapter, relationRegistry);
  }
}
