import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertInnerJoinBehavior,
  assertResultStructure,
  assertEnrichment,
  assertEmptyResult,
  assertRelationRequest,
  assertRootGetManyRequest,
  assertRelationFirst,
  assertSortOrder,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createMinimalRootRelationSet,
  createFilteredDataSet,
  createPriorityDataSet,
  createCombinedFiltersSet,
} from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToManyForwardRelation,
  createOneToManyWithDistinctFilter,
  TestRelationService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Behavior tests for INNER JOIN pattern achieved through right-side filters
 *
 * Key Concept: While LEFT JOIN is the default federation behavior (all roots returned),
 * INNER JOIN can be achieved using existence filters on relation fields like:
 * - relations.rootId||$notnull
 * - relations.status||$notnull
 *
 * This causes only roots with matching relations to be returned.
 */
describe('CrudFederationService - Behavior: INNER JOIN via Filters', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the 'relations' relation that tests use
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Forward Relationships with INNER JOIN', () => {
    it('should constrain root results when relation existence filter present (INNER JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        { filter: ['relations.rootId||$notnull'] },
        [relation],
      );
      const data = createMinimalRootRelationSet();

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 3 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots.slice(0, 2), {
          limit: 10,
          total: 2,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertInnerJoinBehavior(
        mocks.mockRootService,
        mocks.mockRelationService,
        { rootId: { $notnull: true } },
        [1, 2],
      );
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Relation 1' }],
        2: [
          { id: 2, rootId: 2, title: 'Relation 2' },
          { id: 3, rootId: 2, title: 'Relation 3' },
        ],
      });
    });

    it('should apply INNER JOIN with relation value filters (status=active)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        { filter: ['relations.status||$eq||active'] },
        [relation],
      );
      const data = createFilteredDataSet();

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.activeRelations, { total: 2 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots.slice(0, 2), {
          limit: 10,
          total: 2,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertInnerJoinBehavior(
        mocks.mockRootService,
        mocks.mockRelationService,
        { status: { $eq: 'active' } },
        [1, 2],
      );
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Active Task', status: 'active' }],
        2: [{ id: 2, rootId: 2, title: 'Active Item', status: 'active' }],
      });
    });

    it('should apply INNER JOIN with multiple relation filters (AND condition)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          filter: [
            'relations.status||$eq||active',
            'relations.priority||$gte||5',
          ],
        },
        [relation],
      );
      const data = createPriorityDataSet();

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.highPriorityActiveRelations, {
          total: 2,
        }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 2 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [{ status: { $eq: 'active' } }, { priority: { $gte: 5 } }],
        },
      });
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [
          {
            id: 1,
            rootId: 1,
            title: 'Critical Bug',
            status: 'active',
            priority: 10,
          },
        ],
        2: [
          {
            id: 2,
            rootId: 2,
            title: 'Important Feature',
            status: 'active',
            priority: 8,
          },
        ],
      });
    });

    it('should return empty result when no relations match filters (INNER JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        { filter: ['relations.status||$eq||archived'] },
        [relation],
      );

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRelationRequest(mocks.mockRelationService, {
        search: { status: { $eq: 'archived' } },
      });
      assertEmptyResult(result);
    });

    it('should apply INNER JOIN with combined root and relation filters', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          filter: ['name||$cont||Project', 'relations.status||$eq||active'],
        },
        [relation],
      );
      const data = createCombinedFiltersSet();

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.activeRelations, { total: 2 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.projectRoots, { limit: 10, total: 2 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRelationRequest(mocks.mockRelationService, {
        search: { status: { $eq: 'active' } },
      });
      assertRootGetManyRequest(mocks.mockRootService, {
        search: {
          $and: [{ name: { $cont: 'Project' } }, { id: { $in: [1, 2] } }],
        },
      });
      assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Feature A', status: 'active' }],
        2: [{ id: 2, rootId: 2, title: 'Feature B', status: 'active' }],
      });
    });

    describe('INNER JOIN with Pagination', () => {
      it('should handle INNER JOIN with pagination on page 1', async () => {
        // ARRANGE
        const relation = createOneToManyForwardRelation(
          'relations',
          TestRelationService,
        );
        const req = mocks.createTestRequest(
          {
            filter: ['relations.status||$eq||active'],
            page: '1',
            limit: '3',
          },
          [relation],
        );

        // Create test data - roots 1,2,3,5,7 have active relations
        const activeRelations = [
          { id: 1, rootId: 1, title: 'Relation 1A', status: 'active' },
          { id: 2, rootId: 2, title: 'Relation 2A', status: 'active' },
          { id: 3, rootId: 3, title: 'Relation 3A', status: 'active' },
          { id: 4, rootId: 5, title: 'Relation 5A', status: 'active' },
          { id: 5, rootId: 7, title: 'Relation 7A', status: 'active' },
        ];

        const page1Roots = [
          { id: 1, name: 'Root 1' },
          { id: 2, name: 'Root 2' },
          { id: 3, name: 'Root 3' },
        ];

        mocks.mockRelationService.getMany.mockResolvedValue(
          createPaginatedResponse(activeRelations, { total: 5 }),
        );
        mocks.mockRootService.getMany.mockResolvedValue(
          createPaginatedResponse(page1Roots, { limit: 3, total: 5 }),
        );

        // ACT
        const result = await mocks.service.getMany(req);

        // ASSERT
        assertServiceCallCounts([
          { service: mocks.mockRootService, count: 1 },
          { service: mocks.mockRelationService, count: 1 },
        ]);
        assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

        // Verify relation filter applied first
        assertRelationRequest(mocks.mockRelationService, {
          search: { status: { $eq: 'active' } },
        });

        // Verify root constraint from discovered IDs, with pagination
        assertRootGetManyRequest(mocks.mockRootService, {
          search: { id: { $in: [1, 2, 3, 5, 7] } },
          page: 1,
          limit: 3,
        });

        const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
        expect(rootCall.parsed.page).toBe(1);

        // ASSERT - Result verification
        assertResultStructure(result, { count: 3, total: 5 });
        expect(result.page).toBe(1);
        expect(result.pageCount).toBe(2);

        assertEnrichment(result, 'relations', {
          1: [{ id: 1, rootId: 1, title: 'Relation 1A', status: 'active' }],
          2: [{ id: 2, rootId: 2, title: 'Relation 2A', status: 'active' }],
          3: [{ id: 3, rootId: 3, title: 'Relation 3A', status: 'active' }],
        });
      });

      it('should handle INNER JOIN with pagination on page 2', async () => {
        // ARRANGE
        const relation = createOneToManyForwardRelation(
          'relations',
          TestRelationService,
        );
        const req = mocks.createTestRequest(
          {
            filter: ['relations.status||$eq||active'],
            page: '2',
            limit: '3',
          },
          [relation],
        );

        // Same active relations as page 1
        const activeRelations = [
          { id: 1, rootId: 1, title: 'Relation 1A', status: 'active' },
          { id: 2, rootId: 2, title: 'Relation 2A', status: 'active' },
          { id: 3, rootId: 3, title: 'Relation 3A', status: 'active' },
          { id: 4, rootId: 5, title: 'Relation 5A', status: 'active' },
          { id: 5, rootId: 7, title: 'Relation 7A', status: 'active' },
        ];

        // Page 2 roots (remaining 2 roots)
        const page2Roots = [
          { id: 5, name: 'Root 5' },
          { id: 7, name: 'Root 7' },
        ];

        mocks.mockRelationService.getMany.mockResolvedValue(
          createPaginatedResponse(activeRelations, { total: 5 }),
        );
        mocks.mockRootService.getMany.mockResolvedValue(
          createPaginatedResponse(page2Roots, { limit: 3, total: 5 }),
        );

        // ACT
        const result = await mocks.service.getMany(req);

        // ASSERT
        assertServiceCallCounts([
          { service: mocks.mockRootService, count: 1 },
          { service: mocks.mockRelationService, count: 1 },
        ]);
        assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

        // Verify relation filter applied first
        assertRelationRequest(mocks.mockRelationService, {
          search: { status: { $eq: 'active' } },
        });

        // Verify root constraint from discovered IDs, with pagination
        assertRootGetManyRequest(mocks.mockRootService, {
          search: { id: { $in: [1, 2, 3, 5, 7] } },
          page: 2,
          limit: 3,
        });

        const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
        expect(rootCall.parsed.page).toBe(2);

        // ASSERT - Result verification
        assertResultStructure(result, { count: 2, total: 5 });
        expect(result.page).toBe(2);
        expect(result.pageCount).toBe(2);

        assertEnrichment(result, 'relations', {
          5: [{ id: 4, rootId: 5, title: 'Relation 5A', status: 'active' }],
          7: [{ id: 5, rootId: 7, title: 'Relation 7A', status: 'active' }],
        });
      });

      it('should handle INNER JOIN pagination when filter reduces results below page size', async () => {
        // ARRANGE
        const relation = createOneToManyForwardRelation(
          'relations',
          TestRelationService,
        );
        const req = mocks.createTestRequest(
          {
            filter: ['relations.status||$eq||critical'],
            page: '1',
            limit: '5', // Request 5 but only 2 roots have critical relations
          },
          [relation],
        );

        const criticalRelations = [
          { id: 1, rootId: 1, title: 'Critical Task A', status: 'critical' },
          { id: 2, rootId: 3, title: 'Critical Task B', status: 'critical' },
        ];

        const filteredRoots = [
          { id: 1, name: 'Root 1' },
          { id: 3, name: 'Root 3' },
        ];

        mocks.mockRelationService.getMany.mockResolvedValue(
          createPaginatedResponse(criticalRelations, { total: 2 }),
        );
        mocks.mockRootService.getMany.mockResolvedValue(
          createPaginatedResponse(filteredRoots, { limit: 5, total: 2 }),
        );

        // ACT
        const result = await mocks.service.getMany(req);

        // ASSERT
        assertServiceCallCounts([
          { service: mocks.mockRootService, count: 1 },
          { service: mocks.mockRelationService, count: 1 },
        ]);
        assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

        // Verify relation filter applied first
        assertRelationRequest(mocks.mockRelationService, {
          search: { status: { $eq: 'critical' } },
        });

        // Verify root constraint from discovered IDs
        assertRootGetManyRequest(mocks.mockRootService, {
          search: { id: { $in: [1, 3] } },
          limit: 5,
          page: 1,
        });

        // ASSERT - Result verification (fewer results than requested page size)
        assertResultStructure(result, { count: 2, total: 2 });
        expect(result.page).toBe(1);
        expect(result.pageCount).toBe(1);

        assertEnrichment(result, 'relations', {
          1: [
            {
              id: 1,
              rootId: 1,
              title: 'Critical Task A',
              status: 'critical',
            },
          ],
          3: [
            {
              id: 2,
              rootId: 3,
              title: 'Critical Task B',
              status: 'critical',
            },
          ],
        });
      });
    });

    describe('INNER JOIN with Relation Sorting', () => {
      it('should preserve relation sort order in INNER JOIN scenario', async () => {
        // ARRANGE
        const relation = createOneToManyWithDistinctFilter(
          'relations',
          TestRelationService,
          { isLatest: { $eq: true } }, // distinctFilter for uniqueness
        );
        const req = mocks.createTestRequest(
          {
            filter: [
              'relations.status||$eq||active',
              'relations.rootId||$notnull',
            ], // INNER JOIN trigger + required $notnull
            sort: ['relations.title,ASC'], // Relation sort
          },
          [relation],
        );

        // Relation data sorted by title: Alpha, Beta, Charlie
        const sortedActiveRelations = [
          { id: 1, rootId: 2, title: 'Alpha Task', status: 'active' },
          { id: 2, rootId: 1, title: 'Beta Task', status: 'active' },
          { id: 3, rootId: 3, title: 'Charlie Task', status: 'active' },
        ];

        // Root data returned in natural order (NOT relation sort order)
        const rootsInNaturalOrder = [
          { id: 1, name: 'Root 1' },
          { id: 2, name: 'Root 2' },
          { id: 3, name: 'Root 3' },
        ];

        // First call: distinctFilter applied for sorting (unique relations)
        // Second call: all active relations for enrichment
        mocks.mockRelationService.getMany
          .mockResolvedValueOnce(
            createPaginatedResponse(sortedActiveRelations, { total: 3 }),
          )
          .mockResolvedValueOnce(
            createPaginatedResponse(sortedActiveRelations, { total: 3 }),
          );
        mocks.mockRootService.getMany.mockResolvedValue(
          createPaginatedResponse(rootsInNaturalOrder, {
            limit: 3,
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
        assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

        // Verify first call: relation service called with INNER JOIN filter and sort
        assertRelationRequest(
          mocks.mockRelationService,
          {
            page: 1,
            limit: 10,
            search: {
              $and: [
                { status: { $eq: 'active' } },
                { rootId: { $notnull: true } },
              ],
            },
            sort: [{ field: 'title', order: 'ASC' }],
          },
          0,
        );

        // Verify second call: enrichment call for discovered root IDs
        assertRelationRequest(
          mocks.mockRelationService,
          {
            search: {
              $and: [
                { status: { $eq: 'active' } },
                { rootId: { $notnull: true } },
                { rootId: { $in: [2, 1, 3] } },
              ],
            },
          },
          1,
        );

        // Verify root service called with discovered IDs from sorted relations
        assertRootGetManyRequest(mocks.mockRootService, {
          search: { id: { $in: [2, 1, 3] } }, // IDs in relation sort order
        });

        // ASSERT - Result verification: roots should be in relation sort order [2, 1, 3]
        assertResultStructure(result, { count: 3, total: 3 });
        assertSortOrder(result, [2, 1, 3]); // Critical: verify parent order matches child sort

        assertEnrichment(result, 'relations', {
          2: [{ id: 1, rootId: 2, title: 'Alpha Task', status: 'active' }],
          1: [{ id: 2, rootId: 1, title: 'Beta Task', status: 'active' }],
          3: [{ id: 3, rootId: 3, title: 'Charlie Task', status: 'active' }],
        });
      });

      it('should handle INNER JOIN with relation sort and multiple relations per root', async () => {
        // ARRANGE
        const relation = createOneToManyWithDistinctFilter(
          'relations',
          TestRelationService,
          { isLatest: { $eq: true } }, // distinctFilter for uniqueness
        );
        const req = mocks.createTestRequest(
          {
            filter: [
              'relations.priority||$gte||5',
              'relations.rootId||$notnull',
            ], // INNER JOIN trigger + required $notnull
            sort: ['relations.priority,DESC'], // Relation sort by priority
          },
          [relation],
        );

        // Relations sorted by priority DESC with multiple per root
        const sortedHighPriorityRelations = [
          {
            id: 1,
            rootId: 1,
            title: 'Critical',
            priority: 10,
            status: 'active',
          },
          { id: 2, rootId: 1, title: 'High A', priority: 8, status: 'active' },
          { id: 3, rootId: 2, title: 'High B', priority: 7, status: 'active' },
          { id: 4, rootId: 3, title: 'Medium', priority: 5, status: 'active' },
        ];

        // Roots in natural order (will be re-ordered by service)
        const rootsInNaturalOrder = [
          { id: 1, name: 'Root 1' },
          { id: 2, name: 'Root 2' },
          { id: 3, name: 'Root 3' },
        ];

        // First call: distinctFilter applied for sorting (unique relations)
        // Second call: all high priority relations for enrichment
        const uniqueHighPriorityRelations = sortedHighPriorityRelations.filter(
          (relation, index, array) =>
            array.findIndex((r) => r.rootId === relation.rootId) === index,
        );
        mocks.mockRelationService.getMany
          .mockResolvedValueOnce(
            createPaginatedResponse(uniqueHighPriorityRelations, { total: 3 }),
          )
          .mockResolvedValueOnce(
            createPaginatedResponse(sortedHighPriorityRelations, { total: 4 }),
          );
        mocks.mockRootService.getMany.mockResolvedValue(
          createPaginatedResponse(rootsInNaturalOrder, {
            limit: 3,
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
        assertRelationFirst(mocks.mockRootService, [mocks.mockRelationService]);

        // Verify first call: relation service called with filter and sort
        assertRelationRequest(
          mocks.mockRelationService,
          {
            page: 1,
            limit: 10,
            search: {
              $and: [{ priority: { $gte: 5 } }, { rootId: { $notnull: true } }],
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
                { priority: { $gte: 5 } },
                { rootId: { $notnull: true } },
                { rootId: { $in: [1, 2, 3] } },
              ],
            },
          },
          1,
        );

        // Verify root service called with deduped IDs in relation order [1, 2, 3]
        assertRootGetManyRequest(mocks.mockRootService, {
          search: { id: { $in: [1, 2, 3] } },
        });

        // ASSERT - Result verification: roots should be ordered by first relation occurrence
        assertResultStructure(result, { count: 3, total: 3 });
        assertSortOrder(result, [1, 2, 3]); // Order by first occurrence in sorted relations

        // Verify all relations are properly attached
        assertEnrichment(result, 'relations', {
          1: [
            {
              id: 1,
              rootId: 1,
              title: 'Critical',
              priority: 10,
              status: 'active',
            },
            {
              id: 2,
              rootId: 1,
              title: 'High A',
              priority: 8,
              status: 'active',
            },
          ],
          2: [
            {
              id: 3,
              rootId: 2,
              title: 'High B',
              priority: 7,
              status: 'active',
            },
          ],
          3: [
            {
              id: 4,
              rootId: 3,
              title: 'Medium',
              priority: 5,
              status: 'active',
            },
          ],
        });
      });
    });
  });
});
