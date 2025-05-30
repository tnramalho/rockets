import { Entity } from 'typeorm';

import { RoleAssignmentSqliteEntity } from '@concepta/nestjs-typeorm-ext';

/**
 * Role Entity Fixture
 */
@Entity()
export class UserRoleEntityFixture extends RoleAssignmentSqliteEntity {}
