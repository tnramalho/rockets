import { mock } from 'jest-mock-extended';

import {
  CallHandler,
  ExecutionContext,
  PlainLiteralObject,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Test, TestingModule } from '@nestjs/testing';

import { CrudActions } from '../../crud/enums/crud-actions.enum';
import { CrudRequestInterceptor } from '../../crud/interceptors/crud-request.interceptor';
import { CrudModelOptionsInterface } from '../../crud/interfaces/crud-model-options.interface';
import { CrudOptionsInterface } from '../../crud/interfaces/crud-options.interface';
import { CrudRequestInterface } from '../../crud/interfaces/crud-request.interface';
import { CRUD_MODULE_CRUD_REQUEST_KEY } from '../../crud.constants';
import { QueryRelation } from '../../request/types/crud-request-query.types';
import { CrudFederationService } from '../crud-federation.service';
import { CrudReflectionService } from '../crud-reflection.service';
import { CrudRelationRegistry } from '../crud-relation.registry';
import { CrudFetchServiceInterface } from '../interfaces/crud-fetch-service.interface';

import {
  TestRoot,
  TestRelation,
  TestProfile,
  TestSettings,
  TestRootService,
  TestRelationService,
  TestProfileService,
  TestSettingsService,
  createTestRelations,
} from './crud-federation-test-entities';

// Request object interface for interceptor testing
interface MockRequest {
  query: PlainLiteralObject;
  [CRUD_MODULE_CRUD_REQUEST_KEY]?: CrudRequestInterface<TestRoot>;
}

export interface CrudFederationTestMocks {
  service: CrudFederationService<TestRoot, TestRelation[]>;
  interceptor: CrudRequestInterceptor<TestRoot>;
  module: TestingModule;
  mockRootService: jest.Mocked<CrudFetchServiceInterface<TestRoot>>;
  mockRelationService: jest.Mocked<CrudFetchServiceInterface<TestRelation>>;
  mockProfileService: jest.Mocked<CrudFetchServiceInterface<TestProfile>>;
  mockSettingsService: jest.Mocked<CrudFetchServiceInterface<TestSettings>>;
  relationRegistry: CrudRelationRegistry<TestRoot, TestRelation[]>;
  resetAllMocks: () => void;
  registerRelation: (
    service: CrudFetchServiceInterface<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => void;
  applyInterceptorTransform: (
    query: PlainLiteralObject,
    options?: Partial<CrudOptionsInterface<TestRoot>>,
    action?: CrudActions,
  ) => CrudRequestInterface<TestRoot>;
  createTestRequest: (
    query?: PlainLiteralObject,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    relations?: QueryRelation<TestRoot, any>[],
  ) => CrudRequestInterface<TestRoot>;
}

export const setupCrudFederationTests =
  async (): Promise<CrudFederationTestMocks> => {
    // Mock service setup with proper constructors
    const mockRootService = Object.create(TestRootService.prototype);
    Object.assign(mockRootService, {
      getMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'Root 1' },
        { id: 2, name: 'Root 2' },
      ]),
      getOne: jest.fn().mockResolvedValue({ id: 1, name: 'Root 1' }),
    });

    const mockRelationService = Object.create(TestRelationService.prototype);
    Object.assign(mockRelationService, {
      getMany: jest.fn().mockResolvedValue([
        { id: 1, rootId: 1, title: 'Relation 1' },
        { id: 2, rootId: 2, title: 'Relation 2' },
      ]),
    });

    const mockProfileService = Object.create(TestProfileService.prototype);
    Object.assign(mockProfileService, {
      getMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          rootId: 1,
          bio: 'Profile for Root 1',
          avatar: 'avatar1.jpg',
        },
      ]),
    });

    const mockSettingsService = Object.create(TestSettingsService.prototype);
    Object.assign(mockSettingsService, {
      getMany: jest
        .fn()
        .mockResolvedValue([
          { id: 1, rootId: 1, theme: 'dark', notifications: true },
        ]),
    });

    // Create relation registry and register services
    const relationRegistry = new CrudRelationRegistry<
      TestRoot,
      TestRelation[]
    >();

    // Register relations if any tests need them
    // Note: Tests that don't use relations will pass empty relations array
    // Tests that do use relations should call registerRelation themselves

    // Create interceptor with mocked reflection service
    const mockReflectionService = mock<CrudReflectionService<TestRoot>>();
    const interceptor = new CrudRequestInterceptor<TestRoot>(
      mockReflectionService,
    );

    // Create service directly with constructor injection instead of using NestJS module
    const service = new CrudFederationService<TestRoot, TestRelation[]>(
      mockRootService,
      relationRegistry,
    );

    // Create module for compatibility (though not used for service injection anymore)
    const module = await Test.createTestingModule({
      providers: [],
    }).compile();

    const resetAllMocks = () => {
      // mockClear() clears call history but keeps implementation
      // mockReset() clears call history and resets implementation to return undefined
      // Using mockClear() since tests set up their own return values
      mockRootService.getMany.mockClear();
      mockRootService.getOne.mockClear();
      mockRelationService.getMany.mockClear();
      mockProfileService.getMany.mockClear();
      mockSettingsService.getMany.mockClear();
    };

    const registerRelation = (
      service: CrudFetchServiceInterface<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    ) => {
      relationRegistry.register(service);
    };

    const applyInterceptorTransform = (
      query: PlainLiteralObject,
      options: Partial<CrudOptionsInterface<TestRoot>> = {},
      action: CrudActions = CrudActions.ReadAll,
    ): CrudRequestInterface<TestRoot> => {
      // Create request object that interceptor will mutate
      const req: MockRequest = { query };

      // Mock reflection service returns
      mockReflectionService.getRequestOptions.mockReturnValue({
        model: {} as CrudModelOptionsInterface,
        ...options,
      });
      mockReflectionService.getAction.mockReturnValue(action);

      // Mock execution context
      const mockContext = mock<ExecutionContext>();
      const mockHttpContext = mock<HttpArgumentsHost>();
      mockHttpContext.getRequest.mockReturnValue(req);
      mockContext.switchToHttp.mockReturnValue(mockHttpContext);

      // Execute interceptor - it will mutate req
      interceptor.intercept(mockContext, mock<CallHandler>());

      // Return the transformed request (we know it exists after interceptor runs)
      return req[CRUD_MODULE_CRUD_REQUEST_KEY]!;
    };

    const createTestRequest = (
      query?: PlainLiteralObject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relations: QueryRelation<TestRoot, any>[] = [],
    ): CrudRequestInterface<TestRoot> => {
      const options: Partial<CrudOptionsInterface<TestRoot>> = {};

      // Add relations if provided
      if (relations.length > 0) {
        options.query = {
          relations: createTestRelations(relations),
        };
      }

      return applyInterceptorTransform(query || {}, options);
    };

    return {
      service,
      interceptor,
      module,
      mockRootService,
      mockRelationService,
      mockProfileService,
      mockSettingsService,
      relationRegistry,
      resetAllMocks,
      registerRelation,
      applyInterceptorTransform,
      createTestRequest,
    };
  };

export const cleanupCrudFederationTests = async (
  mocks: CrudFederationTestMocks,
): Promise<void> => {
  // Reset mocks to prepare for next test
  mocks.resetAllMocks();
  await mocks.module.close();
};
