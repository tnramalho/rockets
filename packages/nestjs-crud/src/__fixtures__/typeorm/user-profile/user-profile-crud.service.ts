import { Injectable } from '@nestjs/common';

import { CrudService } from '../../../services/crud.service';

import { UserProfileTypeOrmCrudAdapter } from './user-profile-typeorm-crud.adapter';
import { UserProfileEntity } from './user-profile.entity';

@Injectable()
export class UserProfileCrudService extends CrudService<UserProfileEntity> {
  constructor(crudAdapter: UserProfileTypeOrmCrudAdapter) {
    super(crudAdapter);
  }
}
