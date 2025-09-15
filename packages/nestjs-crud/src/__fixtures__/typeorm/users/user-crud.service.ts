import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common';

import { CrudRelationRegistry } from '../../../services/crud-relation.registry';
import { CrudService } from '../../../services/crud.service';
import { CompanyEntity } from '../company/company.entity';

import { UserTypeOrmCrudAdapter } from './user-typeorm-crud.adapter';
import { UserEntity } from './user.entity';

@Injectable()
export class UserCrudService extends CrudService<UserEntity, [CompanyEntity]> {
  constructor(
    crudAdapter: UserTypeOrmCrudAdapter,
    @Optional()
    @Inject(forwardRef(() => 'USER_RELATION_REGISTRY'))
    relationRegistry?: CrudRelationRegistry<UserEntity, [CompanyEntity]>,
  ) {
    super(crudAdapter, relationRegistry);
  }
}
