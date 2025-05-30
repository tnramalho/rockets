import { Entity } from 'typeorm';

import { RoleAssignmentSqliteEntity } from '@concepta/nestjs-typeorm-ext';

/**
 * Api Key Role Entity Fixture
 */
@Entity()
export class ApiKeyRoleEntityFixture extends RoleAssignmentSqliteEntity {}
