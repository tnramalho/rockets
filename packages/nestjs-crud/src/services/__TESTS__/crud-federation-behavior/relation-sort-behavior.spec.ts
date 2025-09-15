import { CondOperator } from '../../../request/types/crud-request-query.types';
import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertRootGetManyRequest,
  assertRelationRequest,
  assertRelationFirst,
  assertResultStructure,
  assertEnrichment,
  assertEmptyResult,
  assertSortOrder,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createRelationSortByTitleSet,
  createRelationSortByPrioritySet,
  createRelationSortPaginationSet,
  createRelationSortEmptySet,
} from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToManyWithDistinctFilter,
  TestRelationService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Behavior tests for relation sort strategy (Scenario 13)
 * Relation sort requires INNER JOIN semantics with $notnull filter on join key
 * Causes relation-first sequencing with sort applied to driving relation
 */
describe('CrudFederationService - Behavior: Relation Sort Strategy', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the 'relations' relation that tests use
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Forward relationship relation sort', () => {
    it('should sort roots by relation field with distinctFilter and $notnull filter', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'], // Required for relation sort!
          sort: ['relations.title,ASC'],
          page: '1',
          limit: '10',
        },
        [relation],
      );

      const data = createRelationSortByTitleSet();

      // First call: distinctFilter applied for sorting (3 unique relations)
      // Second call: all relations for enrichment (4 total relations)
      mocks.mockRelationService.getMany
        .mockResolvedValueOnce(
          createPaginatedResponse(data.relationsByTitle.slice(0, 3), {
            total: 3,
          }),
        )
        .mockResolvedValueOnce(
          createPaginatedResponse(data.relationsByTitle, { total: 4 }),
        );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.rootsInNaturalOrder, {
          limit: 10,
          total: 3,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 2 }, // One for sorting, one for enrichment
      ]);

      // Verify first call: relation service called with user pagination and distinctFilter applied
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 1,
          limit: 10,
          sort: [{ field: 'title', order: 'ASC' }],
          search: { rootId: { [CondOperator.NOT_NULL]: true } },
        },
        0,
      );

      // Verify distinctFilter was applied to first call
      const relationCall = mocks.mockRelationService.getMany.mock.calls[0][0];
      expect(relationCall.parsed.filter).toEqual(
        expect.arrayContaining([
          { field: 'isLatest', operator: '$eq', value: true },
          {
            field: 'rootId',
            operator: '$notnull',
            relation: 'relations',
            value: '',
          },
        ]),
      );

      // Verify second call: enrichment call for discovered root IDs
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { rootId: { $in: [2, 1, 3] } },
            ],
          },
        },
        1,
      );

      // Verify root request has discovered IDs
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { id: { $in: [2, 1, 3] } }, // Root IDs discovered from sorted relations
        limit: 10, // Preserves original user request limit
        sort: [], // No root sorts (relation sort takes precedence)
        page: 1, // Page is set from original request
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 3, total: 3 });

      // Verify sort order preserved in final results
      assertSortOrder(result, [2, 1, 3]); // Roots in relation sort order

      // Verify enrichment
      assertEnrichment(result, 'relations', {
        2: [{ id: 1, rootId: 2, title: 'Alpha Task' }],
        1: [
          { id: 2, rootId: 1, title: 'Beta Task' },
          { id: 4, rootId: 1, title: 'Delta Task' },
        ],
        3: [{ id: 3, rootId: 3, title: 'Charlie Task' }],
      });
    });

    it('should handle relation sort with additional AND filters', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull', 'relations.priority||$gte||5'],
          sort: ['relations.priority,DESC'],
          page: '1',
          limit: '10',
        },
        [relation],
      );

      const data = createRelationSortByPrioritySet();
      // Only relations with priority >= 5, and only first relation per rootId (distinctFilter effect)
      const highPriorityRelations = data.relationsByPriority
        .filter((relation) => relation.priority >= 5)
        .filter(
          (relation, index, array) =>
            array.findIndex((r) => r.rootId === relation.rootId) === index,
        );

      // First call: distinctFilter applied for sorting (3 unique relations)
      // Second call: all high priority relations for enrichment (4 total high priority relations)
      const allHighPriorityRelations = data.relationsByPriority.filter(
        (relation) => relation.priority >= 5,
      );
      mocks.mockRelationService.getMany
        .mockResolvedValueOnce(
          createPaginatedResponse(highPriorityRelations, { total: 3 }),
        )
        .mockResolvedValueOnce(
          createPaginatedResponse(allHighPriorityRelations, { total: 4 }),
        );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.uniqueRootsInOrder, {
          limit: 10,
          total: 3,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 2 }, // One for sorting, one for enrichment
      ]);

      // Verify relation called first (relation-sort pattern)
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify first call: relation service called with multiple filters and sort
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 1,
          limit: 10,
          search: {
            $and: [{ rootId: { $notnull: true } }, { priority: { $gte: 5 } }],
          },
          sort: [{ field: 'priority', order: 'DESC' }],
        },
        0,
      );

      // Verify second call: enrichment call for discovered root IDs
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { priority: { $gte: 5 } },
              { rootId: { $in: [1, 2, 3] } },
            ],
          },
        },
        1,
      );

      // Verify root request has discovered IDs and correct pagination
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { id: { $in: [1, 2, 3] } },
        limit: 10, // Preserves original user request limit
        page: 1,
        sort: [],
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 3, total: 3 });
      assertSortOrder(result, [1, 2, 3]); // Sorted by priority DESC
    });

    it('should deduplicate roots when multiple relations match', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'],
          sort: ['relations.priority,DESC'],
          page: '1',
          limit: '10',
        },
        [relation],
      );

      const data = createRelationSortByPrioritySet();
      // Apply distinctFilter effect - only first relation per rootId
      const uniqueRelations = data.relationsByPriority.filter(
        (relation, index, array) =>
          array.findIndex((r) => r.rootId === relation.rootId) === index,
      );

      // First call: distinctFilter applied for sorting (unique relations)
      // Second call: all relations for enrichment
      mocks.mockRelationService.getMany
        .mockResolvedValueOnce(
          createPaginatedResponse(uniqueRelations, { total: 3 }),
        )
        .mockResolvedValueOnce(
          createPaginatedResponse(data.relationsByPriority, {
            total: data.relationsByPriority.length,
          }),
        );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.uniqueRootsInOrder, {
          limit: 10,
          total: 3,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 2 }, // One for sorting, one for enrichment
      ]);

      // Verify relation called first (relation-sort pattern)
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify first call: relation service called with filter and sort
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 1,
          limit: 10,
          search: { rootId: { $notnull: true } },
          sort: [{ field: 'priority', order: 'DESC' }],
        },
        0,
      );

      // Verify second call: enrichment call for discovered root IDs
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { rootId: { $in: [1, 2, 3] } },
            ],
          },
        },
        1,
      );

      // Verify root request has discovered IDs and correct pagination
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { id: { $in: [1, 2, 3] } }, // Deduplicated root IDs
        limit: 10, // Preserves original user request limit
        page: 1,
        sort: [],
      });

      // Roots appear only once despite multiple relations
      assertResultStructure(result, { count: 3, total: 3 });
      expect(result.data.map((p) => p.id)).toEqual([1, 2, 3]);
    });

    it('should return empty result when no relations match with sort', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: [
            'relations.rootId||$notnull',
            'relations.status||$eq||archived',
          ],
          sort: ['relations.title,ASC'],
        },
        [relation],
      );

      const data = createRelationSortEmptySet();

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - No relations found, so root not called
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 1 }, // Only one call since no relations found
      ]);

      // Verify the single relation service call had correct filters and sort
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 1,
          limit: 10,
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { status: { $eq: 'archived' } },
            ],
          },
          sort: [{ field: 'title', order: 'ASC' }],
        },
        0,
      );

      assertEmptyResult(result);
    });

    it('should apply relation sort with pagination correctly', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'],
          sort: ['relations.title,ASC'],
          page: '1',
          limit: '5', // First page, 5 roots
        },
        [relation],
      );

      const data = createRelationSortPaginationSet();

      // First call: distinctFilter applied for sorting (paginated relations - first 5 for page 1)
      // Second call: enrichment for discovered root IDs from page 1 (same 5 relations)
      const firstPageRelations = data.allRelationsSorted.slice(0, 5); // First 5 relations for page 1
      mocks.mockRelationService.getMany
        .mockResolvedValueOnce(
          createPaginatedResponse(firstPageRelations, { total: 10 }), // Total across all pages
        )
        .mockResolvedValueOnce(
          createPaginatedResponse(firstPageRelations, { total: 5 }), // Current page count
        );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.firstPageRoots, { limit: 5, total: 10 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 2 }, // One for sorting, one for enrichment
      ]);

      // Verify relation called first (relation-sort pattern)
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify first call: relation service called with filter and sort
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 1,
          limit: 5,
          search: { rootId: { $notnull: true } },
          sort: [{ field: 'title', order: 'ASC' }],
        },
        0,
      );

      // Verify second call: enrichment call for paginated root IDs only (first page)
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { rootId: { $in: [5, 2, 8, 1, 9] } }, // Only first page root IDs
            ],
          },
        },
        1,
      );

      // Verify root request has only paginated root IDs (page 1: first 5)
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { id: { $in: [5, 2, 8, 1, 9] } }, // Only first page root IDs
        limit: 5, // Page limit, not total discovered count
        page: 1,
        sort: [],
      });

      // Verify pagination structure
      expect(result.count).toBe(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(2);

      // Verify first page sort order
      assertSortOrder(result, [5, 2, 8, 1, 9]);
    });

    it('should apply relation sort with pagination correctly for page 2', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true }, // distinctFilter for uniqueness
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'],
          sort: ['relations.title,ASC'],
          page: '2',
          limit: '5', // Second page, 5 roots
        },
        [relation],
      );

      const data = createRelationSortPaginationSet();

      // First call: distinctFilter applied for sorting (paginated relations - second 5 for page 2)
      // Second call: enrichment for discovered root IDs from page 2 (same 5 relations)
      const secondPageRelations = data.allRelationsSorted.slice(5, 10); // Second 5 relations for page 2
      mocks.mockRelationService.getMany
        .mockResolvedValueOnce(
          createPaginatedResponse(secondPageRelations, { total: 10 }), // Total across all pages
        )
        .mockResolvedValueOnce(
          createPaginatedResponse(secondPageRelations, { total: 5 }), // Current page count
        );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.secondPageRoots, {
          limit: 5,
          total: 10,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 2 }, // One for sorting, one for enrichment
      ]);

      // Verify relation called first (relation-sort pattern)
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify first call: relation service called with filter and sort
      assertRelationRequest(
        mocks.mockRelationService,
        {
          page: 2,
          limit: 5,
          search: { rootId: { $notnull: true } },
          sort: [{ field: 'title', order: 'ASC' }],
        },
        0,
      );

      // Verify second call: enrichment call for paginated root IDs only (second page)
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { rootId: { $notnull: true } },
              { rootId: { $in: [4, 7, 3, 6, 10] } }, // Only second page root IDs
            ],
          },
        },
        1,
      );

      // Verify root request has only paginated root IDs (page 2: second 5)
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { id: { $in: [4, 7, 3, 6, 10] } }, // Only second page root IDs
        limit: 5, // Page limit, not total discovered count
        page: 2,
        sort: [],
      });

      // Verify pagination structure
      expect(result.count).toBe(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.pageCount).toBe(2);

      // Verify second page sort order
      assertSortOrder(result, [4, 7, 3, 6, 10]); // Foxtrot, Golf, Hotel, India, Juliet
    });
  });
});
