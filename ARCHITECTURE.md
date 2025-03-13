# Rockets Architecture Guide

This document outlines the architectural patterns and best practices used throughout the Rockets project. Rockets is a collection of libraries designed with low coupling, where dependencies between modules are typically injected through settings to allow overriding.

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [CRUD Pattern](#2-crud-pattern)
3. [Exception Handling](#3-exception-handling)
4. [Service Patterns](#4-service-patterns)
5. [Interface Patterns](#5-interface-patterns)
6. [Testing Patterns](#6-testing-patterns)
7. [Factory and Seeder Patterns](#7-factory-and-seeder-patterns)
8. [Configuration Pattern](#8-configuration-pattern)
9. [Best Practices](#9-best-practices)

## 1. Project Structure

Each module in Rockets follows a consistent structure:

```
packages/nestjs-{module-name}/src/
├── __fixtures__/           # Test fixtures
├── config/                 # Module configuration
├── dto/                    # Data Transfer Objects
├── entities/              # TypeORM entities
├── exceptions/            # Module-specific exceptions
├── interfaces/            # Module interfaces
├── listeners/             # Event listeners
├── services/              # Services (Lookup, Mutate, etc.)
├── {module-name}.constants.ts      # Constants
├── {module-name}.controller.ts     # Controllers
├── {module-name}.module-definition # Module definition
├── {module-name}.module.ts         # Module 
├── {module-name}.types.ts          # Type definitions
└── index.ts                        # Public API exports
```

### Naming Conventions
- Files: kebab-case (e.g., `user-crud.service.ts`)
- Classes: PascalCase (e.g., `UserCrudService`)
- Interfaces: PascalCase with Interface suffix (e.g., `UserEntityInterface`)
- Constants: UPPER_SNAKE_CASE (e.g., `USER_MODULE_USER_ENTITY_KEY`)

## 2. CRUD Pattern

### Controller Pattern

```typescript
// File: packages/nestjs-user/src/controllers/user-crud.controller.ts
import { Controller } from '@nestjs/common';
import { CrudController } from '@concepta/nestjs-crud';
import { AccessControlReadMany } from '@concepta/nestjs-access-control';
import { UserResource } from '../user.constants';
import { UserEntityInterface } from '../interfaces/user-entity.interface';
import { UserCreateDto } from '../dto/user-create.dto';
import { UserUpdateDto } from '../dto/user-update.dto';

@CrudController({
  path: 'users',
  model: {
    type: UserDto,
    paginatedType: UserPaginatedDto,
  },
  params: {
    id: { field: 'id', type: 'string', primary: true }
  }
})
export class UserCrudController {
  constructor(
    @Inject(USER_MODULE_USER_CRUD_SERVICE_TOKEN)
    protected readonly userCrudService: UserCrudServiceInterface
  ) {}

  @CrudReadMany()
  @AccessControlReadMany(UserResource.Many)
  async getMany() {
    // Custom implementation
    return super.getMany();
  }
}
```

Real implementation example:
```typescript
// File: packages/nestjs-cache/src/controllers/cache-crud.controller.ts
@CrudController({
  path: 'cache/:assignment',
  model: {
    type: CacheDto,
    paginatedType: CachePaginatedDto,
  },
  params: {
    id: { field: 'id', type: 'string', primary: true },
    assignment: {
      field: 'assignment',
      disabled: true,
    },
  },
  join: { cache: { eager: true }, assignee: { eager: true } },
})
export class CacheCrudController extends CrudBaseController<
  CacheEntityInterface,
  CacheCreateDto,
  CacheUpdateDto
> {
  constructor(
    @Inject(CACHE_MODULE_CRUD_SERVICE_TOKEN)
    protected readonly crudService: CacheCrudServiceInterface,
  ) {
    super(crudService);
  }
}
```

### Service Pattern

```typescript
// File: packages/nestjs-user/src/services/user-crud.service.ts
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TypeOrmCrudService } from '@concepta/nestjs-crud';
import { InjectDynamicRepository } from '@concepta/nestjs-typeorm-ext';
import { USER_MODULE_USER_ENTITY_KEY } from '../user.constants';
import { UserEntityInterface } from '../interfaces/user-entity.interface';

@Injectable()
export class UserCrudService extends TypeOrmCrudService<UserEntityInterface> {
  constructor(
    @InjectDynamicRepository(USER_MODULE_USER_ENTITY_KEY)
    protected readonly userRepo: Repository<UserEntityInterface>,
  ) {
    super(userRepo);
  }
}
```

## 3. Exception Handling

Each module should have its base exception that extends `RuntimeException`, and module-specific exceptions should extend this base:

```typescript
// File: packages/nestjs-user/src/exceptions/user.exception.ts
import { RuntimeException } from '@concepta/nestjs-exception';

export class UserException extends RuntimeException {
  constructor(message: string, options?: RuntimeExceptionOptions) {
    super({
      message,
      errorCode: 'USER_ERROR',
      ...options
    });
  }
}

// File: packages/nestjs-user/src/exceptions/user-not-found.exception.ts
export class UserNotFoundException extends UserException {
  constructor(userId: string) {
    super({
      message: 'User %s not found',
      messageParams: [userId],
      errorCode: 'USER_NOT_FOUND',
      httpStatus: HttpStatus.NOT_FOUND,
    });
  }
}
```

## 4. Service Patterns

### Lookup & Mutate Pattern

The project uses a clear separation between lookup (read) and mutate (write) operations through interfaces and base services:

#### Lookup Interfaces
```typescript
// Base lookup interface for ID-based operations
export interface LookupIdInterface<
  T = ReferenceId,
  U = ReferenceIdInterface,
  O extends ReferenceQueryOptionsInterface = ReferenceQueryOptionsInterface,
> {
  byId: (id: T, options?: O) => Promise<U | null>;
}

// Example of a service interface extending multiple lookup interfaces
export interface UserLookupServiceInterface
  extends LookupIdInterface<ReferenceId, ReferenceIdInterface, QueryOptionsInterface>,
    LookupEmailInterface<ReferenceEmail, ReferenceIdInterface, QueryOptionsInterface>,
    LookupUsernameInterface<ReferenceUsername, ReferenceIdInterface, QueryOptionsInterface> {
  // Additional lookup methods specific to User
}
```

#### Mutate Interfaces
```typescript
// Base interfaces for CRUD operations
export interface CreateOneInterface<T, U extends ReferenceIdInterface> {
  create: (object: T, options?: QueryOptionsInterface) => Promise<U>;
}

export interface UpdateOneInterface<
  T extends ReferenceIdInterface,
  U extends ReferenceIdInterface = T,
  O extends ReferenceQueryOptionsInterface = ReferenceQueryOptionsInterface,
> {
  update: (object: T, options?: O) => Promise<U>;
}

// Example of a service interface extending multiple mutate interfaces
export interface UserMutateServiceInterface
  extends CreateOneInterface<UserCreatableInterface, UserEntityInterface>,
    UpdateOneInterface<UserUpdatableInterface & ReferenceIdInterface, UserEntityInterface>,
    ReplaceOneInterface<UserCreatableInterface & ReferenceIdInterface, UserEntityInterface>,
    RemoveOneInterface<UserEntityInterface, UserEntityInterface> {
  // Additional mutate methods specific to User
}
```

#### Base Entity Classes
The project provides base entity classes for different database types:

```typescript
// For PostgreSQL
export abstract class CommonPostgresEntity
  extends AuditPostgresEntity
  implements ReferenceIdInterface, AuditInterface {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}

// For SQLite
export abstract class CommonSqliteEntity
  extends AuditSqlLiteEntity
  implements ReferenceIdInterface, AuditInterface {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
}
```

#### Implementation Example
```typescript
// Entity implementation
@Entity()
export class UserPostgresEntity
  extends CommonPostgresEntity
  implements UserEntityInterface {
  @Column()
  email!: string;
  
  @Column()
  username!: string;
}

// Service implementation
@Injectable()
export class UserLookupService
  extends LookupService<UserEntityInterface>
  implements UserLookupServiceInterface {
  constructor(
    @InjectDynamicRepository(USER_MODULE_USER_ENTITY_KEY)
    protected readonly userRepo: Repository<UserEntityInterface>,
  ) {
    super(userRepo);
  }

  // byId is already implemented by LookupService

  // Implement LookupEmailInterface
  async byEmail(
    email: ReferenceEmail,
    queryOptions?: QueryOptionsInterface,
  ): Promise<UserEntityInterface | null> {
    return this.findOne({ where: { email } }, queryOptions);
  }

  // Implement LookupUsernameInterface
  async byUsername(
    username: ReferenceUsername,
    queryOptions?: QueryOptionsInterface,
  ): Promise<UserEntityInterface | null> {
    return this.findOne({ where: { username } }, queryOptions);
  }
}

@Injectable()
export class UserMutateService
  extends MutateService<
    UserEntityInterface,
    UserCreatableInterface,
    UserUpdatableInterface
  >
  implements UserMutateServiceInterface {
  protected createDto = UserCreateDto;
  protected updateDto = UserUpdateDto;

  constructor(
    @InjectDynamicRepository(USER_MODULE_USER_ENTITY_KEY)
    protected readonly userRepo: Repository<UserEntityInterface>,
  ) {
    super(userRepo);
  }
}
```

## 5. Interface Patterns

### Entity Interfaces

```typescript
// Base entity interface
export interface UserEntityInterface extends ReferenceIdInterface, AuditInterface {
  email: string;
  username: string;
  // ... other properties
}

// Entity implementation for PostgreSQL
@Entity()
export class UserPostgresEntity
  extends CommonPostgresEntity
  implements UserEntityInterface {
  @Column()
  email!: string;

  @Column()
  username!: string;
}

// Entity implementation for SQLite
@Entity()
export class UserSqliteEntity
  extends CommonSqliteEntity
  implements UserEntityInterface {
  @Column()
  email!: string;

  @Column()
  username!: string;
}
```

### DTO Interfaces

```typescript
// Base interface with all properties
export interface UserInterface extends ReferenceIdInterface, AuditInterface {
  email: string;
  username: string;
  active?: boolean;
  password?: string;
}

// Creatable interface derives required properties from base interface
export interface UserCreatableInterface
  extends Pick<UserInterface, 'username' | 'email'>,
    Partial<Pick<UserInterface, 'active'>>,
    Partial<PasswordPlainInterface> {}

// Updatable interface makes all properties optional
export interface UserUpdatableInterface
  extends Partial<Pick<UserInterface, 'username' | 'email' | 'active'>>,
    Partial<PasswordPlainInterface> {}

// DTO implementation
@Exclude()
export class UserDto extends CommonEntityDto implements UserInterface {
  @Expose()
  @ApiProperty({
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @Expose()
  @ApiProperty({
    description: 'User username',
  })
  @IsString()
  username!: string;

  @Expose()
  @ApiProperty({
    description: 'User active status',
  })
  @IsBoolean()
  active?: boolean;
}

@Exclude()
export class UserPasswordDto {
  @Expose()
  @ApiProperty({
    description: 'User password',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

@Exclude()
export class UserCreateDto
  extends IntersectionType(
    PickType(UserDto, ['username', 'email'] as const),
    PartialType(PickType(UserDto, ['active'] as const)),
    PartialType(UserPasswordDto),
  )
  implements UserCreatableInterface {}

@Exclude()
export class UserUpdateDto
  extends IntersectionType(
    PartialType(PickType(UserDto, ['username', 'email', 'active'] as const)),
    PartialType(UserPasswordDto),
  )
  implements UserUpdatableInterface {}
```

## 6. Testing Patterns

### Unit Tests

Example of a service unit test:

```typescript
describe('YourService', () => {
  let service: YourService;
  let repository: MockType<Repository<Entity>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: getRepositoryToken(Entity),
          useFactory: repositoryMockFactory
        }
      ]
    }).compile();

    service = module.get<YourService>(YourService);
    repository = module.get(getRepositoryToken(Entity));
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

### E2E Tests

Example of an end-to-end test:

```typescript
describe('YourController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST endpoint', () => {
    return request(app.getHttpServer())
      .post('/your-endpoint')
      .send(testData)
      .expect(201);
  });
});
```

## 7. Factory and Seeder Patterns

### Factory Pattern

Factories are used to generate test data and seed the database with realistic data. They extend the base `Factory` class from `@concepta/typeorm-seeding`:

```typescript
import { Factory } from '@concepta/typeorm-seeding';
import { faker } from '@faker-js/faker';
import { UserEntityInterface } from './interfaces/user-entity.interface';

export class UserFactory extends Factory<UserEntityInterface> {
  // Track used values to ensure uniqueness
  protected usedUsernames: Record<string, boolean> = {};

  // Define how to create an entity
  protected async entity(user: UserEntityInterface): Promise<UserEntityInterface> {
    user.username = this.generateUniqueUsername();
    user.email = faker.internet.email();
    return user;
  }

  // Optional finalize method for post-processing
  protected async finalize(user: UserEntityInterface): Promise<void> {
    // Perform any necessary post-processing
  }

  // Helper methods for generating unique data
  protected generateUniqueUsername(): string {
    let username: string;
    do {
      username = faker.internet.userName().toLowerCase();
    } while (this.usedUsernames[username]);
    this.usedUsernames[username] = true;
    return username;
  }
}
```

### Seeder Pattern

Seeders are used to populate the database with initial data. They extend the base `Seeder` class:

```typescript
import { Seeder } from '@concepta/typeorm-seeding';
import { UserFactory } from './user.factory';

export class UserSeeder extends Seeder {
  public async run(): Promise<void> {
    // Get environment variables or use defaults
    const createAmount = process.env?.USER_MODULE_SEEDER_AMOUNT
      ? Number(process.env.USER_MODULE_SEEDER_AMOUNT)
      : 50;

    // Initialize the factory
    const userFactory = this.factory(UserFactory);

    // Create specific entities
    await userFactory
      .map(async (user) => this.customizeUser(user))
      .create({
        username: 'superadmin',
      });

    // Create multiple entities
    await userFactory
      .map(async (user) => this.customizeUser(user))
      .createMany(createAmount);
  }

  // Helper methods for customizing entities
  protected async customizeUser(user: UserEntityInterface): Promise<UserEntityInterface> {
    // Customize the user entity
    return user;
  }
}
```

### Factory Dependencies

Factories can depend on other factories to create related entities:

```typescript
export class OrgProfileFactory extends Factory<OrgProfileEntityInterface> {
  protected async finalize(orgProfile: OrgProfileEntityInterface): Promise<void> {
    if (!orgProfile.orgId) {
      const orgFactory = this.factory(OrgFactory);
      const org = await orgFactory.create();
      orgProfile.orgId = org.id;
    }
  }
}
```

### Test Fixtures

Test fixtures are used to create isolated, reusable test environments. They are stored in the `__fixtures__` directory of each module and follow these patterns:

#### Entity Fixtures

Entity fixtures extend the base SQLite entities for testing:

```typescript
import { Entity } from 'typeorm';
import { UserSqliteEntity } from '../entities/user-sqlite.entity';

@Entity()
export class UserEntityFixture extends UserSqliteEntity {
  // Add test-specific relationships
  @OneToMany(() => UserOtpEntityFixture, (userOtp) => userOtp.assignee)
  userOtps?: UserOtpEntityFixture[];
}
```

#### Factory Fixtures

Factory fixtures are used to create test entities with specific overrides:

```typescript
import { Factory } from '@concepta/typeorm-seeding';
import { UserEntityFixture } from './user-entity.fixture';

export class UserFactoryFixture extends Factory<UserEntityFixture> {
  options = {
    entity: UserEntityFixture,
    // Optionally override the main factory
    override: UserFactory
  };
}
```

#### Module Fixtures

Module fixtures set up the test environment with necessary dependencies:

```typescript
import { Module, Global } from '@nestjs/common';
import { TypeOrmExtModule } from '@concepta/nestjs-typeorm-ext';
import { UserEntityFixture } from './user-entity.fixture';
import { UserLookupServiceFixture } from './user-lookup-service.fixture';

@Global()
@Module({
  providers: [UserLookupServiceFixture],
  exports: [UserLookupServiceFixture],
})
export class UserModuleFixture {
  static register(): DynamicModule {
    return {
      module: UserModuleFixture,
      imports: [
        TypeOrmExtModule.forFeature({
          user: {
            entity: UserEntityFixture,
          },
        }),
      ],
    };
  }
}
```

#### Service Fixtures

Service fixtures implement interfaces for testing:

```typescript
import { ValidateTokenServiceInterface } from '../interfaces/validate-token-service.interface';

export class ValidateTokenServiceFixture implements ValidateTokenServiceInterface {
  async validateToken(_payload: object): Promise<boolean> {
    // Test implementation
    return true;
  }
}
```

#### When to Create Fixtures

Create fixtures in the following scenarios:

1. **Entity Testing**: When you need to test entity relationships or database operations
   - Create an entity fixture extending the SQLite variant
   - Add test-specific relationships and columns

2. **Module Testing**: When testing module configuration and dependency injection
   - Create a module fixture with test-specific providers
   - Use `@Global()` if the module needs to be available throughout tests

3. **Service Testing**: When mocking service behavior
   - Create service fixtures implementing the service interface
   - Provide test-specific implementations of methods

4. **Factory Testing**: When you need to create test data with specific patterns
   - Create factory fixtures extending the base Factory class
   - Override the main factory if needed for test-specific behavior

5. **Integration Testing**: When testing multiple components together
   - Create fixtures for all required components
   - Use the module fixture to wire everything together

## 8. Configuration Pattern

// ... existing code ...

## 9. Best Practices

// ... existing code ...