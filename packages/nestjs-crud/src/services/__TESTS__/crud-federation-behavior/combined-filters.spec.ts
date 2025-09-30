import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertResultStructure,
  assertEnrichment,
  assertRelationRequest,
  assertRootGetManyRequest,
  assertRootFirst,
} from '../../__FIXTURES__/crud-federation-test-assertions';
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
 * Behavior tests for combined root and relation filters with pagination
 * Tests the interaction between root-side and relation-side filters
 * with proper INNER JOIN behavior and pagination handling
 */
describe('CrudFederationService - Behavior: Combined Root+Relation Filters', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the 'relations' relation that tests use
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Combined Filters with Pagination', () => {
    it('should handle root filter + relation filter with page 1', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          filter: ['name||$cont||Project', 'relations.status||$eq||active'],
          page: '1',
          limit: '3',
        },
        [relation],
      );

      // Test data - 5 roots match name filter, but only 3 have active relations
      const activeRelations = [
        {
          id: 1,
          rootId: 1,
          title: 'Feature A',
          status: 'active',
          isLatest: true,
        },
        {
          id: 2,
          rootId: 2,
          title: 'Feature B',
          status: 'active',
          isLatest: true,
        },
        {
          id: 3,
          rootId: 4,
          title: 'Feature C',
          status: 'active',
          isLatest: true,
        },
        // Root 3 and 5 have inactive relations or no relations
      ];

      const page1ProjectRoots = [
        { id: 1, name: 'Project Alpha' },
        { id: 2, name: 'Project Beta' },
        { id: 4, name: 'Project Delta' },
      ];

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(activeRelations, { total: 3 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(page1ProjectRoots, { limit: 3, total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 2 }, // 1 total count + 1 data retrieval
        { service: mocks.mockRelationService, count: 2 }, // 1 constraint discovery + 1 enrichment
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify relation filter applied first (constraint discovery call)
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [{ status: { $eq: 'active' } }, { isLatest: { $eq: true } }],
          },
          limit: 3,
          offset: 0,
        },
        0,
      );

      // Verify enrichment call (relation filter + root ID constraints)
      assertRelationRequest(
        mocks.mockRelationService,
        {
          search: {
            $and: [
              { status: { $eq: 'active' } },
              { isLatest: { $eq: true } },
              { rootId: { $in: [1, 2, 4] } },
            ],
          },
        },
        1,
      );

      // Verify root total count call (first call - index 0) - only has original root filters
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: { name: { $cont: 'Project' } },
          page: 1,
          limit: 1,
        },
        0,
      );

      // Verify root filter + discovered root IDs constraint (data retrieval call - index 1)
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: {
            $and: [{ name: { $cont: 'Project' } }, { id: { $in: [1, 2, 4] } }],
          },
          page: 1,
          limit: 3,
        },
        1,
      );

      // ASSERT - Result verification
      assertResultStructure(result, { count: 3, total: 3 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);

      assertEnrichment(result, 'relations', {
        1: [
          {
            id: 1,
            rootId: 1,
            title: 'Feature A',
            status: 'active',
            isLatest: true,
          },
        ],
        2: [
          {
            id: 2,
            rootId: 2,
            title: 'Feature B',
            status: 'active',
            isLatest: true,
          },
        ],
        4: [
          {
            id: 3,
            rootId: 4,
            title: 'Feature C',
            status: 'active',
            isLatest: true,
          },
        ],
      });
    });

    it('should handle root filter + relation filter with page 2', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          filter: ['name||$cont||Task', 'relations.priority||$gte||5'],
          page: '2',
          limit: '2',
        },
        [relation],
      );

      // Test data - roots with Task names and high priority relations
      const highPriorityRelations = [
        { id: 1, rootId: 1, title: 'Critical Task', priority: 10 },
        { id: 2, rootId: 2, title: 'High Task A', priority: 8 },
        { id: 3, rootId: 3, title: 'High Task B', priority: 7 },
        { id: 4, rootId: 5, title: 'Medium Task', priority: 5 },
        { id: 5, rootId: 6, title: 'Important Task', priority: 6 },
      ];

      // Page 2 of Task roots (with pagination applied)
      const page2TaskRoots = [
        { id: 5, name: 'Task Manager' },
        { id: 6, name: 'Task Scheduler' },
      ];

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(highPriorityRelations, { total: 5 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(page2TaskRoots, { limit: 2, total: 5 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 2 }, // 1 total count + 1 data retrieval
        { service: mocks.mockRelationService, count: 2 }, // 1 constraint discovery + 1 enrichment
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify relation filter applied first (constraint discovery with proper pagination offset for page 2)
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [{ priority: { $gte: 5 } }, { isLatest: { $eq: true } }],
        },
        limit: 2,
        offset: 2, // Page 2: (2-1) * 2 = 2
      });

      // Verify root total count call (first call - index 0) - only has original root filters
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: { name: { $cont: 'Task' } },
          page: 1,
          limit: 1,
        },
        0,
      );

      // Verify root filter + discovered root IDs constraint (data retrieval call - index 1)
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: {
            $and: [
              { name: { $cont: 'Task' } },
              { id: { $in: [1, 2, 3, 5, 6] } },
            ],
          },
          page: 1,
          limit: 2,
        },
        1,
      );

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 5 });
      expect(result.page).toBe(2);
      expect(result.pageCount).toBe(3);

      assertEnrichment(result, 'relations', {
        5: [{ id: 4, rootId: 5, title: 'Medium Task', priority: 5 }],
        6: [{ id: 5, rootId: 6, title: 'Important Task', priority: 6 }],
      });
    });

    it('should handle multiple root filters + relation filters with pagination', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          filter: [
            'name||$cont||Project',
            'companyId||$eq||1',
            'relations.status||$eq||active',
            'relations.priority||$gte||7',
          ],
          page: '1',
          limit: '5',
        },
        [relation],
      );

      // Test data - complex filter scenario
      const activeHighPriorityRelations = [
        {
          id: 1,
          rootId: 1,
          title: 'Critical Feature',
          status: 'active',
          priority: 10,
        },
        {
          id: 2,
          rootId: 3,
          title: 'High Priority Task',
          status: 'active',
          priority: 8,
        },
        {
          id: 3,
          rootId: 4,
          title: 'Important Feature',
          status: 'active',
          priority: 7,
        },
      ];

      const filteredProjectRoots = [
        { id: 1, name: 'Project Alpha', companyId: 1 },
        { id: 3, name: 'Project Gamma', companyId: 1 },
        { id: 4, name: 'Project Delta', companyId: 1 },
      ];

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(activeHighPriorityRelations, { total: 3 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(filteredProjectRoots, { limit: 5, total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 2 }, // 1 total count + 1 data retrieval
        { service: mocks.mockRelationService, count: 2 }, // 1 constraint discovery + 1 enrichment
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify relation filters applied first (AND condition, constraint discovery with limit)
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [
            { status: { $eq: 'active' } },
            { priority: { $gte: 7 } },
            { isLatest: { $eq: true } },
          ],
        },
        limit: 5,
        offset: 0,
      });

      // Verify root total count call (first call - index 0) - only has original root filters
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: {
            $and: [{ name: { $cont: 'Project' } }, { companyId: { $eq: 1 } }],
          },
          page: 1,
          limit: 1,
        },
        0,
      );

      // Verify multiple root filters + discovered root IDs constraint (data retrieval call - index 1)
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: {
            $and: [
              { name: { $cont: 'Project' } },
              { companyId: { $eq: 1 } },
              { id: { $in: [1, 3, 4] } },
            ],
          },
          page: 1,
          limit: 5, // Should match user-requested limit
        },
        1,
      );

      // ASSERT - Result verification
      assertResultStructure(result, { count: 3, total: 3 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);

      assertEnrichment(result, 'relations', {
        1: [
          {
            id: 1,
            rootId: 1,
            title: 'Critical Feature',
            status: 'active',
            priority: 10,
          },
        ],
        3: [
          {
            id: 2,
            rootId: 3,
            title: 'High Priority Task',
            status: 'active',
            priority: 8,
          },
        ],
        4: [
          {
            id: 3,
            rootId: 4,
            title: 'Important Feature',
            status: 'active',
            priority: 7,
          },
        ],
      });
    });

    it('should handle combined filters when results are reduced below page size', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          filter: [
            'name||$cont||Enterprise',
            'relations.status||$eq||critical',
          ],
          page: '1',
          limit: '10', // Request 10 but only 2 results match both filters
        },
        [relation],
      );

      const criticalRelations = [
        { id: 1, rootId: 2, title: 'System Outage', status: 'critical' },
        { id: 2, rootId: 5, title: 'Security Breach', status: 'critical' },
      ];

      const enterpriseRoots = [
        { id: 2, name: 'Enterprise Suite' },
        { id: 5, name: 'Enterprise Security' },
      ];

      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(criticalRelations, { total: 2 }),
      );
      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(enterpriseRoots, { limit: 10, total: 2 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 2 }, // 1 total count + 1 data retrieval
        { service: mocks.mockRelationService, count: 2 }, // 1 constraint discovery + 1 enrichment
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify relation filter applied first (constraint discovery with limit)
      assertRelationRequest(mocks.mockRelationService, {
        search: {
          $and: [{ status: { $eq: 'critical' } }, { isLatest: { $eq: true } }],
        },
        limit: 10,
        offset: 0,
      });

      // Verify root total count call (first call - index 0) - only has original root filters
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: { name: { $cont: 'Enterprise' } },
          page: 1,
          limit: 1,
        },
        0,
      );

      // Verify root filter + discovered root IDs constraint (data retrieval call - index 1)
      assertRootGetManyRequest(
        mocks.mockRootService,
        {
          search: {
            $and: [{ name: { $cont: 'Enterprise' } }, { id: { $in: [2, 5] } }],
          },
          page: 1,
          limit: 10, // Should match user-requested limit
        },
        1,
      );

      // ASSERT - Result verification (fewer results than requested page size)
      assertResultStructure(result, { count: 2, total: 2 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);

      assertEnrichment(result, 'relations', {
        2: [{ id: 1, rootId: 2, title: 'System Outage', status: 'critical' }],
        5: [{ id: 2, rootId: 5, title: 'Security Breach', status: 'critical' }],
      });
    });
  });
});
