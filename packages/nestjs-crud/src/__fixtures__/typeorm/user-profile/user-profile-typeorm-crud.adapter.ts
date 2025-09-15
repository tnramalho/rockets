import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeOrmCrudAdapter } from '../../../crud/adapters/typeorm-crud.adapter';

import { UserProfileEntity } from './user-profile.entity';

@Injectable()
export class UserProfileTypeOrmCrudAdapter extends TypeOrmCrudAdapter<UserProfileEntity> {
  constructor(
    @InjectRepository(UserProfileEntity) repo: Repository<UserProfileEntity>,
  ) {
    super(repo);
  }
}
