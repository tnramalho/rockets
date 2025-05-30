import { Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import { RoleAssignmentInterface } from '@concepta/nestjs-common';
import { TypeOrmCrudService } from '@concepta/nestjs-crud';

import { UserRoleEntityFixture } from '../entities/user-role-entity.fixture';

/**
 * Role assignment CRUD service
 */
export class ApiKeyAssignmentCrudServiceFixture extends TypeOrmCrudService<RoleAssignmentInterface> {
  /**
   * Constructor
   *
   * @param userRepo Repository for user entities
   */
  constructor(
    @InjectRepository(UserRoleEntityFixture)
    protected readonly userRepo: Repository<RoleAssignmentInterface>,
  ) {
    super(userRepo);
  }
}
