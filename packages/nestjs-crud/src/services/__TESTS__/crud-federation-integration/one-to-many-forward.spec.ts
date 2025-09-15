import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertRootFirst,
  assertLeftJoinBehavior,
  assertRootGetManyRequest,
  assertRelationRequest,
  assertEnrichment,
  assertResultStructure,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createLargeRootRelationSet,
  createFilteredRootSet,
  createMultiRelationEntitySet,
  createSingleEntitySet,
  createVaryingRelationCountSet,
  createPaginationPage2Set,
  createComplexMultiRelationSet,
} from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToManyForwardRelation,
  TestRelationService,
  TestSettingsService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Integration tests for forward relationship behavior
 * Forward relationships: Relation.rootId -> Root.id
 * Focuses on service interactions, call sequencing, and parameter passing
 */
describe('CrudFederationService - Integration: Forward Relationships', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the relations that tests use
    mocks.registerRelation(mocks.mockRelationService);
    mocks.registerRelation(mocks.mockSettingsService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Service Call Sequencing', () => {
    it('should call relation service with proper parameters during discovery (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = createLargeRootRelationSet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 5 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 4 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 10,
      });

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2, 3, 4, 5] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 5 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Relation 1' }],
        2: [{ id: 2, rootId: 2, title: 'Relation 2' }],
        3: [{ id: 3, rootId: 3, title: 'Relation 3' }],
        4: [], // No relations
        5: [], // No relations
      });

      // Relation 4 (rootId: 99) should not be attached to any root since root 99 doesn't exist
      // This is verified implicitly by checking that roots 4 and 5 have empty arrays
    });

    it('should call root service with no filters when relations are empty (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = createLargeRootRelationSet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 5 }),
      );
      // Empty relations to test LEFT JOIN behavior - all roots should still be returned
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { limit: 100, total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2, 3, 4, 5] } },
      });

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        limit: 10,
        page: 1,
      });

      // ASSERT - Verify all roots have empty relation arrays when no relations exist
      assertResultStructure(result, { count: 5, total: 5 });
      assertEnrichment(result, 'relations', {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
      });
    });
  });

  describe('Parameter Passing and Request Construction', () => {
    it('should preserve original request parameters in root service call (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = createSingleEntitySet();
      const extendedData = {
        roots: [...data.roots, { id: 2, name: 'Root 2' }],
        relations: data.relations,
      };

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(extendedData.roots, { limit: 10, total: 2 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(extendedData.relations, {
          limit: 100,
          total: 1,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service gets original request parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        limit: 10,
        page: 1,
      });

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Only Relation' }],
        2: [],
      });
    });

    it('should call root service with relation metadata after relation discovery (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = {
        roots: [
          { id: 5, name: 'Root 5' },
          { id: 8, name: 'Root 8' },
        ],
        relations: [
          { id: 1, rootId: 5, title: 'Relation 1' },
          { id: 2, rootId: 8, title: 'Relation 2' },
        ],
      };

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 2 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 2 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockRelationService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 10,
      });

      // Verify relation metadata
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.options?.query?.relations).toBeDefined();
      expect(rootCall.options?.query?.relations?.relations).toHaveLength(1);

      const relationMeta = rootCall.options?.query?.relations?.relations?.[0];
      expect(relationMeta?.property).toBe('relations');
      expect(relationMeta?.primaryKey).toBe('id');
      expect(relationMeta?.foreignKey).toBe('rootId');
      expect(relationMeta?.cardinality).toBe('many');
      expect(relationMeta?.owner).toBe(false);
      expect(relationMeta?.service).toBeDefined();

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [5, 8] } },
      });

      // Verify root pagination parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        limit: 10,
        page: 1,
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        5: [{ id: 1, rootId: 5, title: 'Relation 1' }],
        8: [{ id: 2, rootId: 8, title: 'Relation 2' }],
      });
    });
  });

  describe('Filter Application and Processing', () => {
    it('should delegate root filters correctly and preserve LEFT JOIN behavior (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          page: '1',
          limit: '10',
          filter: [
            'name||$eq||root-filter', // Root filter only
          ],
        },
        [relation],
      );
      const data = createFilteredRootSet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.filteredRoots, { limit: 10, total: 1 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 1 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);

      // Verify root gets filter converted to search
      assertRootGetManyRequest(mocks.mockRootService, {
        search: { name: { $eq: 'root-filter' } },
        limit: 10,
        page: 1,
      });

      // Verify filter delegation - original filter array still present
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.filter).toEqual([
        { field: 'name', operator: '$eq', value: 'root-filter' },
      ]);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 1, total: 1 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'relation-1' }],
      });
    });
  });

  describe('One-to-Many Relationship Data Patterns', () => {
    it('should handle root with multiple relations - all relations returned in collection (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = createMultiRelationEntitySet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 2 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 4 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [
          { id: 1, rootId: 1, title: 'Relation 1A' },
          { id: 2, rootId: 1, title: 'Relation 1B' },
          { id: 3, rootId: 1, title: 'Relation 1C' },
        ],
        2: [{ id: 4, rootId: 2, title: 'Relation 2A' }],
      });
    });

    it('should handle root with single relation - relation returned in collection (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const singleRelationData = createSingleEntitySet();
      const extendedData = {
        roots: [...singleRelationData.roots, { id: 2, name: 'Root 2' }],
        relations: singleRelationData.relations,
      };

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(extendedData.roots, { limit: 10, total: 2 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(extendedData.relations, {
          limit: 100,
          total: 1,
        }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 2 });
      assertEnrichment(result, 'relations', {
        1: [{ id: 1, rootId: 1, title: 'Only Relation' }],
        2: [],
      });
    });

    it('should handle multiple roots with varying relation counts (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);
      const data = createVaryingRelationCountSet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 4 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 6 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2, 3, 4] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 4, total: 4 });
      assertEnrichment(result, 'relations', {
        1: [
          { id: 1, rootId: 1, title: 'Relation 1A' },
          { id: 2, rootId: 1, title: 'Relation 1B' },
          { id: 3, rootId: 1, title: 'Relation 1C' },
        ],
        2: [{ id: 4, rootId: 2, title: 'Relation 2A' }],
        3: [],
        4: [
          { id: 5, rootId: 4, title: 'Relation 4A' },
          { id: 6, rootId: 4, title: 'Relation 4B' },
        ],
      });
    });

    it('should handle pagination impact on relation collection completeness (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '2', limit: '5' }, [
        relation,
      ]);
      const data = createPaginationPage2Set();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 5, total: 10 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 6 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root pagination parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 2,
        limit: 5,
      });
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.page).toBe(2);

      // Verify relation service called with root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [6, 7, 8, 9, 10] } },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 10 });
      assertEnrichment(result, 'relations', {
        6: [
          { id: 11, rootId: 6, title: 'Relation 6A' },
          { id: 12, rootId: 6, title: 'Relation 6B' },
        ],
        7: [{ id: 13, rootId: 7, title: 'Relation 7A' }],
        8: [
          { id: 14, rootId: 8, title: 'Relation 8A' },
          { id: 15, rootId: 8, title: 'Relation 8B' },
          { id: 16, rootId: 8, title: 'Relation 8C' },
        ],
        9: [],
        10: [],
      });
    });

    it('should handle root with multiple relationships correctly (LEFT JOIN)', async () => {
      // ARRANGE
      const relationsRelation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const settingsRelation = createOneToManyForwardRelation(
        'settings',
        TestSettingsService,
      );
      const req = mocks.createTestRequest({}, [
        relationsRelation,
        settingsRelation,
      ]);
      const data = createComplexMultiRelationSet();

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(data.roots, { limit: 10, total: 5 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(data.relations, { total: 6 }),
      );
      mocks.mockSettingsService.getMany.mockResolvedValue(
        createPaginatedResponse(data.settings, { total: 6 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
        { service: mocks.mockSettingsService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [
        mocks.mockRelationService,
        mocks.mockSettingsService,
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root pagination parameters
      assertRootGetManyRequest(mocks.mockRootService, {});

      // Verify relation services called with all root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [1, 2, 3, 4, 5] } },
      });
      const settingsRequest =
        mocks.mockSettingsService.getMany.mock.calls[0][0];
      expect(settingsRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2, 3, 4, 5] },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 5 });

      // Verify both relationship properties are enriched
      result.data.forEach((root) => {
        expect(root).toHaveProperty('relations');
        expect(Array.isArray(root.relations)).toBe(true);
        expect(root).toHaveProperty('settings');
        expect(Array.isArray(root.settings)).toBe(true);
      });

      // Verify relation enrichment
      assertEnrichment(result, 'relations', {
        1: [
          { id: 1, rootId: 1, title: 'Relation 1A' },
          { id: 2, rootId: 1, title: 'Relation 1B' },
        ],
        2: [{ id: 3, rootId: 2, title: 'Relation 2A' }],
        3: [],
        4: [
          { id: 4, rootId: 4, title: 'Relation 4A' },
          { id: 5, rootId: 4, title: 'Relation 4B' },
          { id: 6, rootId: 4, title: 'Relation 4C' },
        ],
        5: [],
      });

      // Verify settings enrichment
      assertEnrichment(result, 'settings', {
        1: [
          { id: 1, rootId: 1, theme: 'dark', notifications: true },
          { id: 2, rootId: 1, theme: 'light', notifications: false },
        ],
        2: [],
        3: [{ id: 3, rootId: 3, theme: 'auto', notifications: true }],
        4: [],
        5: [
          { id: 4, rootId: 5, theme: 'dark', notifications: false },
          { id: 5, rootId: 5, theme: 'light', notifications: true },
          { id: 6, rootId: 5, theme: 'auto', notifications: false },
        ],
      });
    });
  });

  describe('Pagination edge cases', () => {
    it('should handle request for page beyond available pages', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '3', limit: '5' }, [
        relation,
      ]); // Request page 3 when only 2 pages exist

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse([], { limit: 5, total: 10 }), // Empty results for page 3
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 0 }, // No relation call since no roots
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root pagination parameters
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.page).toBe(3);
      expect(rootCall.parsed.limit).toBe(5);

      // ASSERT - Result verification (empty page)
      assertResultStructure(result, { count: 0, total: 10 });
      expect(result.page).toBe(3);
      expect(result.pageCount).toBe(2); // Still shows correct page count
      expect(result.data).toEqual([]);
    });

    it('should handle single result with pagination parameters', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      const singleRoot = [{ id: 1, name: 'Only Root' }];
      const singleRootRelations = [
        { id: 1, rootId: 1, title: 'Relation 1' },
        { id: 2, rootId: 1, title: 'Relation 2' },
      ];

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(singleRoot, { limit: 10, total: 1 }),
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(singleRootRelations, { total: 2 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify relation service called with single root ID
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // ASSERT - Result verification (single result)
      assertResultStructure(result, { count: 1, total: 1 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);

      assertEnrichment(result, 'relations', {
        1: [
          { id: 1, rootId: 1, title: 'Relation 1' },
          { id: 2, rootId: 1, title: 'Relation 2' },
        ],
      });
    });

    it('should handle zero results with pagination parameters', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '5' }, [
        relation,
      ]);

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse([], { limit: 5, total: 0 }), // No results
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 0 }, // No relation call since no roots
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // ASSERT - Result verification (zero results)
      assertResultStructure(result, { count: 0, total: 0 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('should handle last page with partial results', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({ page: '3', limit: '5' }, [
        relation,
      ]); // Last page with only 2 results

      const lastPageRoots = [
        { id: 11, name: 'Root 11' },
        { id: 12, name: 'Root 12' },
      ];

      const lastPageRelations = [
        { id: 11, rootId: 11, title: 'Relation 11A' },
        { id: 12, rootId: 12, title: 'Relation 12A' },
        { id: 13, rootId: 12, title: 'Relation 12B' },
      ];

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(lastPageRoots, { limit: 5, total: 12 }), // Page 3 of 12 total (partial page)
      );
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(lastPageRelations, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockRelationService, count: 1 },
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root pagination parameters
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.page).toBe(3);
      expect(rootCall.parsed.limit).toBe(5);

      // Verify relation service called with last page root IDs
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $in: [11, 12] } },
      });

      // ASSERT - Result verification (partial last page)
      assertResultStructure(result, { count: 2, total: 12 });
      expect(result.page).toBe(3);
      expect(result.pageCount).toBe(3); // 12 total / 5 per page = 3 pages

      assertEnrichment(result, 'relations', {
        11: [{ id: 11, rootId: 11, title: 'Relation 11A' }],
        12: [
          { id: 12, rootId: 12, title: 'Relation 12A' },
          { id: 13, rootId: 12, title: 'Relation 12B' },
        ],
      });
    });
  });
});
