import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertRelationRequest,
  assertRootFirstGetOne,
  assertRootGetOneRequest,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createMinimalRootRelationSet,
  createSingleEntitySet,
  createMultiRelationSet,
} from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToManyForwardRelation,
  createOneToOneForwardRelation,
  TestRelationService,
  TestProfileService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Integration tests for getOne federation with relation hydration
 * Tests single entity fetching with relation hydration support
 */
describe('CrudFederationService - Integration: getOne Hydration', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the relations that tests use
    mocks.registerRelation(mocks.mockRelationService);
    mocks.registerRelation(mocks.mockProfileService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('no relations', () => {
    it('should fetch single root without relations', async () => {
      // ARRANGE
      const data = createSingleEntitySet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);

      const req = mocks.createTestRequest({});

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result).toEqual(data.roots[0]);
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(0);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});
    });
  });

  describe('one-to-one forward relation', () => {
    it('should hydrate existing one-to-one relation', async () => {
      // ARRANGE
      const data = createMinimalRootRelationSet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([data.relations[0]], { total: 1 }),
      );

      const relation = createOneToOneForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({}, [relation]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify relation service was called with correct filter
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - the relation should be attached to the root
      expect(result.relations).toEqual(data.relations[0]);
    });

    it('should handle missing one-to-one relation', async () => {
      // ARRANGE
      const data = createSingleEntitySet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      const relation = createOneToOneForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({}, [relation]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify relation service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - relation should be null when missing
      expect(result.relations).toBeNull();
    });
  });

  describe('one-to-many forward relation', () => {
    it('should hydrate multiple one-to-many relations', async () => {
      // ARRANGE
      const data = createMultiRelationSet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);
      // Create test data with multiple relations for root 1
      const multipleRelations = [
        { id: 1, rootId: 1, title: 'Relation 1' },
        { id: 2, rootId: 1, title: 'Relation 2' },
      ];
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(multipleRelations, { total: 2 }),
      );

      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({}, [relation]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify relation service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - the relations array should be properly attached
      expect(result.relations).toEqual(multipleRelations);
    });

    it('should handle empty one-to-many relation', async () => {
      // ARRANGE
      const data = createSingleEntitySet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({}, [relation]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [mocks.mockRelationService]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify relation service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - empty relations array
      expect(result.relations).toEqual([]);
    });
  });

  describe('mixed relation types', () => {
    it('should hydrate both one-to-one and one-to-many relations', async () => {
      // ARRANGE
      const data = createMultiRelationSet();
      mocks.mockRootService.getOne.mockResolvedValue(data.roots[0]);

      // Mock profile service (one-to-one)
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse([data.profiles[0]], { total: 1 }),
      );

      // Mock relation service (one-to-many) - create multiple relations for root 1
      const multipleRelations = [
        { id: 1, rootId: 1, title: 'Relation 1' },
        { id: 2, rootId: 1, title: 'Relation 2' },
      ];
      mocks.mockRelationService.getMany.mockResolvedValue(
        createPaginatedResponse(multipleRelations, { total: 2 }),
      );

      const profileRelation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const relationRelation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest({}, [
        profileRelation,
        relationRelation,
      ]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockProfileService.getMany).toHaveBeenCalledTimes(1);
      expect(mocks.mockRelationService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [
        mocks.mockProfileService,
        mocks.mockRelationService,
      ]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify profile service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockProfileService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify relation service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockRelationService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - both relations should be properly attached
      expect(result.profile).toEqual(data.profiles[0]);
      expect(result.relations).toEqual(multipleRelations);
    });
  });

  describe('null foreign key handling', () => {
    it('should handle null foreign key in forward relationship', async () => {
      // ARRANGE
      const rootWithNullForeignKey = {
        id: 1,
        name: 'Only Root',
        profileId: null,
      };

      mocks.mockRootService.getOne.mockResolvedValue(rootWithNullForeignKey);
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse([], { total: 0 }),
      );

      // Create forward relation but this root has no profile, so it should return null
      const relation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const req = mocks.createTestRequest({}, [relation]);

      // ACT
      const result = await mocks.service.getOne(req);

      // ASSERT
      expect(result.id).toBe(1);

      // Service call verification
      expect(mocks.mockRootService.getOne).toHaveBeenCalledTimes(1);
      expect(mocks.mockProfileService.getMany).toHaveBeenCalledTimes(1);
      assertRootFirstGetOne(mocks.mockRootService, [mocks.mockProfileService]);

      // Verify root service was called with correct parameters
      assertRootGetOneRequest(mocks.mockRootService, {});

      // Verify profile service was called with correct filter and NO limit
      assertRelationRequest(mocks.mockProfileService, {
        search: { rootId: { $eq: 1 } },
      });

      // Verify enrichment - profile should be null for null foreign key
      expect(result.profile).toBeNull();
    });
  });
});
