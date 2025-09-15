import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertNoRelationServiceCalls,
  assertRootGetManyRequest,
  assertResultStructure,
  assertEmptyResult,
  assertSortOrder,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createMinimalRootRelationSet,
  createSortDataSet,
} from '../../__FIXTURES__/crud-federation-test-data';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Behavior tests for queries without any relation relationships
 * Verifies that root-only queries pass through unchanged
 */
describe('CrudFederationService - Behavior: No Relations Query', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  it('should pass through root request unchanged when no relations exist', async () => {
    // ARRANGE
    const req = mocks.createTestRequest({});
    const data = createMinimalRootRelationSet();

    mocks.mockRootService.getMany.mockResolvedValue(
      createPaginatedResponse(data.roots, { limit: 10, total: 3 }),
    );

    // ACT
    const result = await mocks.service.getMany(req);

    // ASSERT
    assertServiceCallCounts([
      { service: mocks.mockRootService, count: 1 },
      { service: mocks.mockRelationService, count: 0 },
    ]);
    assertNoRelationServiceCalls(mocks.mockRelationService);
    assertRootGetManyRequest(mocks.mockRootService, {});
    assertResultStructure(result, { count: 3, total: 3 });
  });

  it('should preserve root filters when no relations exist', async () => {
    // ARRANGE - Use interceptor to properly transform filters to search
    const req = mocks.createTestRequest({ filter: ['name||$eq||test'] });
    const filteredRoots = [{ id: 1, name: 'test' }];

    mocks.mockRootService.getMany.mockResolvedValue(
      createPaginatedResponse(filteredRoots, { limit: 10, total: 1 }),
    );

    // ACT
    const result = await mocks.service.getMany(req);

    // ASSERT
    assertServiceCallCounts([
      { service: mocks.mockRootService, count: 1 },
      { service: mocks.mockRelationService, count: 0 },
    ]);
    assertNoRelationServiceCalls(mocks.mockRelationService);
    assertRootGetManyRequest(mocks.mockRootService, {
      search: { name: { $eq: 'test' } },
    });
    assertResultStructure(result, { count: 1, total: 1 });
    expect(result.data[0]).toEqual({ id: 1, name: 'test' });
  });

  it('should preserve root sorting when no relations exist', async () => {
    // ARRANGE
    const req = mocks.createTestRequest({ sort: ['name,ASC'] });
    const data = createSortDataSet();

    mocks.mockRootService.getMany.mockResolvedValue(
      createPaginatedResponse(data.rootsByName, { limit: 10, total: 3 }),
    );

    // ACT
    const result = await mocks.service.getMany(req);

    // ASSERT
    assertServiceCallCounts([
      { service: mocks.mockRootService, count: 1 },
      { service: mocks.mockRelationService, count: 0 },
    ]);
    assertNoRelationServiceCalls(mocks.mockRelationService);
    assertRootGetManyRequest(mocks.mockRootService, {
      sort: [{ field: 'name', order: 'ASC' }],
    });
    assertResultStructure(result, { count: 3, total: 3 });
    assertSortOrder(result, [3, 1, 2]);
  });

  it('should handle empty root results with no relations', async () => {
    // ARRANGE
    const req = mocks.createTestRequest({});

    mocks.mockRootService.getMany.mockResolvedValue(
      createPaginatedResponse([], { limit: 10, total: 0 }),
    );

    // ACT
    const result = await mocks.service.getMany(req);

    // ASSERT
    assertServiceCallCounts([
      { service: mocks.mockRootService, count: 1 },
      { service: mocks.mockRelationService, count: 0 },
    ]);
    assertNoRelationServiceCalls(mocks.mockRelationService);
    assertRootGetManyRequest(mocks.mockRootService, {});
    assertEmptyResult(result);
  });
});
