import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertInnerJoinBehavior,
  assertLeftJoinBehavior,
  assertResultStructure,
  assertEnrichment,
  assertRelationRequest,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import { createMinimalRootRelationSet } from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToManyForwardRelation,
  TestRelationService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Tests for join type behavior (LEFT vs INNER) for forward relations
 * Tests automatic $notnull filter injection for INNER join relations
 */
describe('CrudFederationService - Behavior: Join Type (Forward Relations)', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Note: We register basic relations, but tests may override with specific join types
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Forward relationships (one-to-many)', () => {
    it('should use LEFT JOIN by default (no join property specified)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      // No join property specified - should default to LEFT JOIN
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      const data = createMinimalRootRelationSet();
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 3 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Should use LEFT JOIN behavior (root-first, no search constraints)
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);
      assertResultStructure(result, { count: 3, total: 3 });

      // Verify all roots returned (LEFT JOIN behavior)
      expect(result.data).toHaveLength(3);
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Relation 1', isLatest: true }],
        2: [
          { id: 2, rootId: 2, title: 'Relation 2', isLatest: true },
          { id: 3, rootId: 2, title: 'Relation 3', isLatest: false },
        ],
        3: [], // Root 3 has no relations (LEFT JOIN behavior)
      });
    });

    it('should use LEFT JOIN when join: "LEFT" is explicitly specified', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      relation.join = 'LEFT'; // Explicitly specify LEFT JOIN
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      const data = createMinimalRootRelationSet();
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 3 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Should use LEFT JOIN behavior
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);
      assertResultStructure(result, { count: 3, total: 3 });
    });

    it('should automatically inject $notnull filter for join: "INNER" forward relation', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      relation.join = 'INNER'; // Specify INNER JOIN
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      const data = createMinimalRootRelationSet();
      // Only relations with rootId values (simulating INNER JOIN result)
      const innerJoinRelations = data.relations.filter(
        (relation) => relation.rootId,
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(innerJoinRelations, { total: 3 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 3 }),
      );

      // ACT
      await mocks.service.getMany(req);

      // ASSERT - Should trigger INNER JOIN behavior with $notnull search condition
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [{ rootId: { $notnull: true } }, { isLatest: { $eq: true } }],
        },
        limit: 10,
        offset: 0,
      });

      // Should trigger INNER JOIN behavior (relation-first)
      assertInnerJoinBehavior(
        mocks.mockRootService,
        mocks.mockRelationService,
        { $and: [{ rootId: { $notnull: true } }, { isLatest: { $eq: true } }] }, // Expected search condition
        [1, 2],
      );
    });

    it('should preserve existing filters when injecting $notnull for INNER join', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      relation.join = 'INNER';
      const req = mocks.createTestRequest(
        {
          filter: ['relations.status||$eq||active'], // Existing filter
          page: '1',
          limit: '10',
        },
        [relation],
      );

      const data = createMinimalRootRelationSet();
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations.slice(0, 2), { total: 2 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { total: 2 }),
      );

      // ACT
      await mocks.service.getMany(req);

      // ASSERT - Should have both existing filter and injected $notnull in search conditions
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [
            { status: { $eq: 'active' } },
            { rootId: { $notnull: true } },
            { isLatest: { $eq: true } },
          ],
        },
        limit: 10,
        offset: 0,
      });
    });

    it('should not inject duplicate $notnull filter if one already exists', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      relation.join = 'INNER';
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'], // Already has $notnull filter
          page: '1',
          limit: '10',
        },
        [relation],
      );

      const data = createMinimalRootRelationSet();
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 3 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { total: 2 }),
      );

      // ACT
      await mocks.service.getMany(req);

      // ASSERT - Should have only one $notnull search condition (not duplicated)
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [{ rootId: { $notnull: true } }, { isLatest: { $eq: true } }],
        },
        limit: 10,
        offset: 0,
      });
    });
  });
});
