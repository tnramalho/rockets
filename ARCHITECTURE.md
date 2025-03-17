# Rockets Architecture Guide

This document outlines the architectural patterns and best practices used throughout the Rockets project. Rockets follows a modular, clean architecture approach with emphasis on:
- Separation of concerns
- Domain-driven design
- SOLID principles
- Clean code practices
- Testability and maintainability

## Table of Contents

1. [Project Structure](#1-project-structure)
   - Directory Organization
   - Naming Conventions
   - Module Pattern
   - Module Definition
   - Provider Pattern

2. [CRUD Pattern](#2-crud-pattern)
   - Controller Design
   - Service Layer
   - Repository Pattern
   - Data Transfer Objects
   - Validation

3. [Exception Handling](#3-exception-handling)
   - Custom Exceptions
   - Error Hierarchy
   - Error Handling Strategy
   - Logging Pattern
   - HTTP Status Codes

4. [Service Patterns](#4-service-patterns)
   - Base Service Pattern
   - Lookup & Mutate Pattern
   - Query Builder Pattern
   - Service Composition
   - Service Lifecycle

5. [Interface Patterns](#5-interface-patterns)
   - Entity Interfaces
   - Service Interfaces
   - DTO Interfaces
   - Repository Interfaces
   - Type Safety

6. [Testing Patterns](#6-testing-patterns)
   - Unit Testing
   - Integration Testing
   - E2E Testing
   - Test Fixtures
   - Test Data Management

7. [Factory and Seeder Patterns](#7-factory-and-seeder-patterns)
   - Factory Pattern
   - Seeder Pattern
   - Factory Dependencies
   - Data Generation
   - Test Data Management

8. [Configuration Pattern](#8-configuration-pattern)
   - Environment Configuration
   - Module Configuration
   - Dynamic Configuration
   - Configuration Validation
   - Secret Management

9. [Best Practices](#9-best-practices)
   - Code Organization
   - Dependency Injection
   - Error Handling
   - Security
   - Performance
   - Documentation
   - Testing
   - Code Style
   - Version Control
   - Monitoring

## 1. Project Structure

### Directory Organization
Each module in Rockets follows a domain-driven structure where related functionality is grouped together. This organization promotes:
- High cohesion within modules
- Low coupling between modules
- Clear separation of concerns
- Easy navigation and maintenance

The structure follows this pattern:

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
Consistent naming is crucial for maintainability and readability. Follow these patterns:
- Files: kebab-case (e.g., `user-crud.service.ts`)
- Classes: PascalCase (e.g., `UserCrudService`)
- Interfaces: PascalCase with Interface suffix (e.g., `UserEntityInterface`)
- Constants: UPPER_SNAKE_CASE (e.g., `USER_MODULE_USER_ENTITY_KEY`)

### Module Pattern
Modules are the building blocks of the application. Each module should:
- Be self-contained
- Have clear boundaries
- Follow the Single Responsibility Principle
- Use dependency injection for flexibility

```ts
/**
 * User Module
 */
@Module({})
export class UserModule extends UserModuleClass {
  static register(options: UserOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: UserAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: UserOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: UserAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }
}

```

## Module Definition 

```ts

export const {
  ConfigurableModuleClass: UserModuleClass,
  OPTIONS_TYPE: USER_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: User_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<UserOptionsInterface>({
  moduleName: 'User',
  optionsInjectionToken: RAW_OPTIONS_TOKEN,
})
  .setExtras<UserOptionsExtrasInterface>({ global: false }, definitionTransform)
  .build();

export type UserOptions = Omit<typeof USER_OPTIONS_TYPE, 'global'>;
export type UserAsyncOptions = Omit<typeof User_ASYNC_OPTIONS_TYPE, 'global'>;


function definitionTransform(
  definition: DynamicModule,
  extras: UserOptionsExtrasInterface,
): DynamicModule {
  const { providers = [], imports = [] } = definition;
  const { controllers, global = false, entities } = extras;

  if (!entities) {
    throw new Error('You must provide the entities option');
  }

  return {
    ...definition,
    global,
    imports: createUserImports({ imports, entities }),
    providers: createUserProviders({ providers }),
    controllers: createUserControllers({ controllers }),
    exports: [ConfigModule, RAW_OPTIONS_TOKEN, ...createUserExports()],
  };
}
/**
 * Creates the imports array for the User module.
 * The module can receive additional imports through parameters and combines them
 * with the required internal imports like ConfigModule and TypeOrmExtModule.
 * 
 * @param options Object containing optional imports array and required entities
 */
export function createUserImports(
  options: Pick<DynamicModule, 'imports'> & UserEntitiesOptionsInterface,
): Required<Pick<DynamicModule, 'imports'>>['imports'] {
  return [
    ...(options.imports ?? []),
    ConfigModule.forFeature(userDefaultConfig),
    TypeOrmExtModule.forFeature(options.entities),
  ];
}
/**
 * Creates the providers array for a module.
 * By default, it includes static providers like CrudService, domain-specific services, etc.
 * However, the module is flexible and allows overriding any service through options.
 * This enables customization by providing custom implementations of services when needed.
 * 
 * For example, you could provide a custom LookupService implementation:
 * ```ts
 * SomeModule.register({
 *   lookupService: new CustomLookupService()
 * })
 * ```
 * 
 * @param options Object containing optional provider overrides and additional providers
 */

export function createUserProviders(options: {
  overrides?: UserOptions;
  providers?: Provider[];
}): Provider[] {
  return [
    ...(options.providers ?? []),
    UserCrudService,
    createUserSettingsProvider(options.overrides),
    createUserLookupServiceProvider(options.overrides),
    createUserMutateServiceProvider(options.overrides),
    createUserAccessQueryServiceProvider(options.overrides),
  ];
}
/**
 * Creates an array of exports for the module.
 * The exports array determines which providers will be available to other modules that import this one.
 * By default, it exports core services and tokens that other modules commonly need access to:
 * - Settings token for module configuration
 * - Lookup service for read operations
 * - Mutate service for write operations  
 * - CRUD service for full CRUD operations
 * - Access query service for authorization
 *
 * This allows other modules to import and use these services while maintaining encapsulation
 * of internal implementation details.
 */

export function createUserExports(): Required<
  Pick<DynamicModule, 'exports'>
>['exports'] {
  return [
    USER_MODULE_SETTINGS_TOKEN,
    UserLookupService,
    UserMutateService,
    UserCrudService,
    UserAccessQueryService,
  ];
}
/**
 * Creates an array of controllers for the module.
 * This follows the common pattern used across the project's modules for controller configuration:
 * 
 * - Accepts optional overrides through options object
 * - Provides default controllers if no overrides specified
 * - Allows full customization by passing custom controllers
 * - Supports disabling controllers by passing empty array
 * 
 * This pattern is consistent across different module types, for example:
 * ```ts
 * // User module
 * UserModule.register({
 *   controllers: [CustomUserController]
 * })
 *
 * ```
 * The consistent pattern makes the modules predictable and easier to configure
 * while maintaining flexibility for different use cases.
 */


export function createUserControllers(
  overrides: Pick<UserOptions, 'controllers'> = {},
): DynamicModule['controllers'] {
  return overrides?.controllers !== undefined
    ? overrides.controllers
    : [UserController];
}

/**
 * Creates providers for the User module.
 * This follows the standard pattern used across the project for provider configuration:
 * 
 * - Accepts optional overrides through options object
 * - Creates core providers like settings, repositories, and services
 * - Allows overriding individual providers through options
 * - Maintains consistent provider structure across modules
 * 
 * Example usage:
 * ```ts
 * UserModule.register({
 *   userLookupService: CustomLookupService,
 *   userMutateService: CustomMutateService
 * })
 * ```
 * 
 * The providers follow the project's service pattern of separating:
 * - Settings providers for module configuration
 * - Repository providers for data access
 * - Service providers split into lookup and mutate
 */
export function createUserProviders(
  options: Pick<UserOptions, 'overrides'> = {},
): Required<Pick<DynamicModule, 'providers'>>['providers'] {
  return [
    createUserSettingsProvider(options.overrides),
    createUserLookupServiceProvider(options.overrides),
    createUserMutateServiceProvider(options.overrides),
    createUserCrudServiceProvider(options.overrides),
    createUserAccessQueryServiceProvider(options.overrides),
    createUserRepositoryProvider(options.overrides),
  ];
}

/**
 * Creates a settings provider for the User module.
 * This follows the settings provider pattern used across the project:
 * - Takes module options and creates a settings provider
 * - Uses a settings token to inject settings across the module
 * - Allows overriding settings through options
 * - Provides type safety through interfaces
 */
export function createUserSettingsProvider(
  optionsOverrides?: UserOptions,
): Provider {
  return createSettingsProvider<UserSettingsInterface, UserOptionsInterface>({
    settingsToken: USER_MODULE_SETTINGS_TOKEN,
    optionsToken: RAW_OPTIONS_TOKEN,
    settingsKey: userDefaultConfig.KEY,
    optionsOverrides,
  });
}

/**
 * Creates a lookup service provider for the User module.
 * This follows the lookup service pattern:
 * - Handles read operations for user entities
 * - Injects the repository for data access
 * - Allows overriding the service through options
 * - Uses dependency injection for required dependencies
 * - Maintains separation between read and write operations
 */
export function createUserLookupServiceProvider(
  optionsOverrides?: UserOptions,
): Provider {
  return {
    provide: UserLookupService,
    inject: [
      RAW_OPTIONS_TOKEN,
      getDynamicRepositoryToken(USER_MODULE_USER_ENTITY_KEY),
    ],
    useFactory: async (
      options: UserOptionsInterface,
      userRepo: Repository<UserEntityInterface>,
    ) =>
      optionsOverrides?.userLookupService ??
      options.userLookupService ??
      new UserLookupService(userRepo),
  };
}

/**
 * Creates a mutate service provider for the User module.
 * This follows the mutate service pattern:
 * - Handles write operations for user entities
 * - Injects repository and required services
 * - Allows overriding through module options
 * - Separates mutation logic from lookup operations
 * - Handles complex operations like password hashing
 */
export function createUserMutateServiceProvider(
  optionsOverrides?: UserOptions,
): Provider {
  return {
    provide: UserMutateService,
    inject: [
      RAW_OPTIONS_TOKEN,
      getDynamicRepositoryToken(USER_MODULE_USER_ENTITY_KEY),
      UserPasswordService,
    ],
    useFactory: async (
      options: UserOptionsInterface,
      userRepo: Repository<UserEntityInterface>,
      userPasswordService: UserPasswordService,
    ) =>
      optionsOverrides?.userMutateService ??
      options.userMutateService ??
      new UserMutateService(userRepo, userPasswordService),
  };
}

/**
 * Creates an access query service provider for the User module.
 * This follows the query service pattern:
 * - Handles specialized query operations
 * - Focuses on access control and authentication
 * - Allows custom query implementation through options
 * - Separates query logic from core CRUD operations
 * - Maintains single responsibility principle
 */
export function createUserAccessQueryServiceProvider(
  optionsOverrides?: UserOptions,
): Provider {
  return {
    provide: UserAccessQueryService,
    inject: [RAW_OPTIONS_TOKEN, UserPasswordService],
    useFactory: async (options: UserOptionsInterface) =>
      optionsOverrides?.userAccessQueryService ??
      options.userAccessQueryService ??
      new UserAccessQueryService(),
  };
}

```
## 2. CRUD Pattern

### Controller Design
Controllers handle HTTP requests and should:
- Follow REST principles
- Use proper HTTP methods
- Implement proper validation
- Handle errors gracefully
- Document endpoints using OpenAPI/Swagger

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
  path: 'users', // Use plural form for REST endpoints
  model: {
    type: UserDto, // Use for single resource responses
    paginatedType: UserPaginatedDto, // Use for paginated list responses
  },
  params: {
    id: { field: 'id', type: 'string', primary: true } // Define primary key for single resource operations
  }
})
// When to use:
// - Use @CrudController when you need standard CRUD operations (Create, Read, Update, Delete)
// - Use model.type for single resource serialization (GET /users/:id, POST /users, etc)
// - Use model.paginatedType for list responses that require pagination (GET /users?page=1)
// - Use params to define route parameters and their mapping to entity fields
// - Set params.disabled: true to exclude params from query building (like in cache example)
// - Use join for eager loading of related entities in responses
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

if we need yo create a controller with all methods, we can use the following pattern:

```ts

/**
 * User controller.
 */
@CrudController({
  path: 'user',
  model: {
    type: UserDto,
    paginatedType: UserPaginatedDto,
  },
})
@AccessControlQuery({
  service: UserAccessQueryService,
})
@ApiTags('user')
export class UserController
  implements
    CrudControllerInterface<
      UserEntityInterface,
      UserCreatableInterface,
      UserUpdatableInterface
    >
{
  /**
   * Constructor.
   *
   * @param userCrudService - instance of the user crud service
   * @param userPasswordService - instance of user password service
   */
  constructor(
    private userCrudService: UserCrudService,
    private userPasswordService: UserPasswordService,
  ) {}

  /**
   * Get many
   *
   * @param crudRequest - the CRUD request object
   */
  @CrudReadMany()
  @AccessControlReadMany(UserResource.Many)
  async getMany(@CrudRequest() crudRequest: CrudRequestInterface) {
    return this.userCrudService.getMany(crudRequest);
  }

  /**
   * Get one
   *
   * @param crudRequest - the CRUD request object
   */
  @CrudReadOne()
  @AccessControlReadOne(UserResource.One)
  async getOne(@CrudRequest() crudRequest: CrudRequestInterface) {
    return this.userCrudService.getOne(crudRequest);
  }

  /**
   * Create many
   *
   * @param crudRequest - the CRUD request object
   * @param userCreateManyDto - user create many dto
   */
  @CrudCreateMany()
  @AccessControlCreateMany(UserResource.Many)
  async createMany(
    @CrudRequest() crudRequest: CrudRequestInterface,
    @CrudBody() userCreateManyDto: UserCreateManyDto,
  ) {
    // the final data
    const hashed = [];

    // loop all dtos
    for (const userCreateDto of userCreateManyDto.bulk) {
      // hash it
      hashed.push(await this.userPasswordService.setPassword(userCreateDto));
    }

    // call crud service to create
    return this.userCrudService.createMany(crudRequest, { bulk: hashed });
  }

  /**
   * Create one
   *
   * @param crudRequest - the CRUD request object
   * @param userCreateDto - user create dto
   */
  @CrudCreateOne()
  @AccessControlCreateOne(UserResource.One)
  async createOne(
    @CrudRequest() crudRequest: CrudRequestInterface,
    @CrudBody() userCreateDto: UserCreateDto,
  ) {
    // call crud service to create
    return this.userCrudService.createOne(
      crudRequest,
      await this.userPasswordService.setPassword(userCreateDto),
    );
  }

  /**
   * Update one
   *
   * @param crudRequest - the CRUD request object
   * @param userUpdateDto - user update dto
   */
  @CrudUpdateOne()
  @AccessControlUpdateOne(UserResource.One)
  async updateOne(
    @CrudRequest() crudRequest: CrudRequestInterface,
    @CrudBody() userUpdateDto: UserUpdateDto,
    @Param('id') userId?: string,
    @AuthUser() authorizededUser?: AuthenticatedUserInterface,
  ) {
    let hashedObject: Partial<PasswordStorageInterface>;

    try {
      hashedObject = await this.userPasswordService.setPassword(
        userUpdateDto,
        userId,
        authorizededUser,
      );
    } catch (e) {
      if (e instanceof RuntimeException) {
        throw e;
      } else {
        throw new UserBadRequestException({ originalError: e });
      }
    }

    return this.userCrudService.updateOne(crudRequest, hashedObject);
  }

  /**
   * Delete one
   *
   * @param crudRequest - the CRUD request object
   */
  @CrudDeleteOne()
  @AccessControlDeleteOne(UserResource.One)
  async deleteOne(@CrudRequest() crudRequest: CrudRequestInterface) {
    return this.userCrudService.deleteOne(crudRequest);
  }

  /**
   * Recover one
   *
   * @param crudRequest - the CRUD request object
   */
  @CrudRecoverOne()
  @AccessControlRecoverOne(UserResource.One)
  async recoverOne(@CrudRequest() crudRequest: CrudRequestInterface) {
    return this.userCrudService.recoverOne(crudRequest);
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

Exception handling should be:
- Consistent across the application
- Informative but secure
- Properly logged
- HTTP status code appropriate
- Well-documented

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

### Base Service Pattern
Base services provide common functionality and should:
- Implement reusable CRUD operations
- Use generics for type safety
- Follow DRY principle
- Be easily extendable

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
// When to use:
// - Use LookupIdInterface when you need to find entities by their unique ID
// - Use LookupEmailInterface when email-based lookups are required (e.g. user authentication)
// - Use LookupUsernameInterface when username-based lookups are needed (e.g. profile pages)
// - Combine multiple lookup interfaces when an entity needs to be found through different unique identifiers
// - Add custom lookup methods when standard lookup patterns don't cover your use case
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
// When to use:
// - Use CreateOneInterface when you need to create new entities (e.g. user registration, product creation)
// - Use UpdateOneInterface when you need to partially update existing entities (e.g. profile updates)
// - Use ReplaceOneInterface when you need to completely replace entities (e.g. bulk imports)
// - Use RemoveOneInterface when you need to delete entities (e.g. account deletion)
// - Combine multiple interfaces when your service needs different mutation capabilities
// - Can be applied to any domain entity that requires CRUD operations (Users, Products, Orders etc)
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

  // LookupService provides the byId method implementation since it's a common lookup pattern
  // UserLookupServiceInterface extends additional interfaces like:
  // - LookupEmailInterface which requires byEmail method
  // - LookupUsernameInterface which requires byUsername method
  // We implement those interface-specific methods here:

  // Required by LookupEmailInterface
  async byEmail(
    email: ReferenceEmail,
    queryOptions?: QueryOptionsInterface,
  ): Promise<UserEntityInterface | null> {
    return this.findOne({ where: { email } }, queryOptions);
  }

  // Required by LookupUsernameInterface  
  async byUsername(
    username: ReferenceUsername,
    queryOptions?: QueryOptionsInterface,
  ): Promise<UserEntityInterface | null> {
    return this.findOne({ where: { username } }, queryOptions);
  }
}

@Injectable()
/**
 * User mutate service.
 * 
 * When to use:
 * - Use MutateService when you need standard create/update operations
 * - Extend this service when you need custom validation or business logic during mutations
 * - The generic types define:
 *   1. The entity interface (UserEntityInterface)
 *   2. The creatable interface for create operations (UserCreatableInterface) 
 *   3. The updatable interface for update operations (UserUpdatableInterface)
 * - Use createDto and updateDto to define the DTOs used for validation
 * - Inject the repository to handle database operations
 */
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
Entity interfaces should:
- Define clear contracts
- Use proper TypeScript features
- Be well-documented
- Follow single responsibility principle

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

### DTO Pattern
DTOs should:
- Validate input/output
- Transform data between layers
- Hide internal implementation
- Follow interface segregation principle

we should always use interfaces to define the DTOs.
and make all associate with interfaces to respect signature

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

### Unit Testing
Unit tests should:
- Follow AAA pattern (Arrange, Act, Assert)
- Test one thing at a time
- Be independent
- Use proper mocking
- Cover edge cases

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

### E2E Testing
E2E tests should:
- Test complete flows
- Verify integration points
- Use proper test data
- Clean up after themselves
- Be independent

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
Factories should:
- Generate consistent test data
- Handle unique constraints
- Be configurable
- Follow single responsibility

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
Seeders should:
- Initialize database with consistent data
- Be environment-aware
- Be idempotent
- Handle dependencies properly

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

## 9. Best Practices

1. **Code Organization**
   - Follow SOLID principles
   - Keep methods small and focused
   - Use proper abstraction
   - Maintain clear dependencies

2. **Dependency Injection**
   - Use constructor injection
   - Follow interface segregation
   - Avoid circular dependencies
   - Use proper scoping

3. **Error Handling**
   - Use custom exceptions
   - Provide meaningful messages
   - Log appropriately
   - Handle edge cases

4. **Security**
   - Validate all input
   - Sanitize all output
   - Use proper authentication
   - Follow least privilege principle

5. **Performance**
   - Use proper indexes
   - Implement caching
   - Optimize queries
   - Use pagination

6. **Documentation**
   - Use JSDoc
   - Keep docs updated
   - Include examples
   - Document edge cases

7. **Testing**
   - Write comprehensive tests
   - Use proper test doubles
   - Test edge cases
   - Maintain test data

8. **Code Style**
   - Follow style guide
   - Use consistent naming
   - Write clear comments
   - Keep code DRY

9. **Version Control**
   - Review code
   - Keep changes focused

10. **Monitoring**
    - Use proper logging
    - Monitor performance
    - Track errors
    - Set up alerts