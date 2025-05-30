import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntityInterface } from '@concepta/nestjs-common';
import { TypeOrmCrudService } from '@concepta/nestjs-crud';

import { UserEntityFixture } from '../user.entity.fixture';

/**
 * User CRUD service fixture
 */
@Injectable()
export class UserCrudServiceFixture extends TypeOrmCrudService<UserEntityInterface> {
  /**
   * Constructor
   *
   * @param userRepo - instance of the user repository.
   */
  constructor(
    @InjectRepository(UserEntityFixture)
    protected readonly userRepo: Repository<UserEntityInterface>,
  ) {
    super(userRepo);
  }
}
