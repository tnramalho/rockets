import { createPaginatedResponse } from '../../__FIXTURES__/crud-federation-mock-helpers';
import {
  assertServiceCallCounts,
  assertResultStructure,
  assertOneToOneEnrichment,
  assertRootFirst,
  assertLeftJoinBehavior,
  assertRootGetManyRequest,
} from '../../__FIXTURES__/crud-federation-test-assertions';
import { createMultiRelationSet } from '../../__FIXTURES__/crud-federation-test-data';
import {
  createOneToOneForwardRelation,
  TestProfile,
  TestSettings,
  TestProfileService,
  TestSettingsService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Integration tests for one-to-one forward relationship behavior
 * One-to-one forward relationships: Profile.rootId -> Root.id (Root.profile)
 * Focuses on service coordination for single entity enrichment
 */
describe('CrudFederationService - Integration: One-to-One Forward Relationships', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the relations that tests use (one-to-one cardinality)
    mocks.registerRelation(mocks.mockProfileService);
    mocks.registerRelation(mocks.mockSettingsService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Root with existing related entity', () => {
    it('should populate profile entity object on root (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      // Use data helper for consistent test data
      const data = createMultiRelationSet();
      const rootData = data.roots;
      const profileData = data.profiles;

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(rootData, { limit: 10, total: 2 }),
      );
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse(profileData, { total: 1 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockProfileService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockProfileService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 10,
      });

      // Verify profile service called with root IDs
      const profileRequest = mocks.mockProfileService.getMany.mock.calls[0][0];
      expect(profileRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2] },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 2, total: 2 });
      assertOneToOneEnrichment(result, 'profile', {
        1: {
          id: 1,
          rootId: 1,
          bio: 'Profile 1',
          avatar: 'avatar1.jpg',
        },
        2: null,
      });
    });
  });

  describe('Root with missing related entity', () => {
    it('should populate null profile object on root, root still included (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        relation,
      ]);

      // Use data helper for consistent test data
      const data = createMultiRelationSet();
      const rootData = data.roots;
      const profileData: TestProfile[] = []; // No profiles for this test

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(rootData, { limit: 10, total: 2 }),
      );
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse(profileData, { total: 0 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockProfileService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockProfileService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 10,
      });

      // Verify profile service called with root IDs
      const profileRequest = mocks.mockProfileService.getMany.mock.calls[0][0];
      expect(profileRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2] },
      });

      // ASSERT - Result verification (LEFT JOIN: all roots returned with null profiles)
      assertResultStructure(result, { count: 2, total: 2 });
      assertOneToOneEnrichment(result, 'profile', {
        1: null,
        2: null,
      });
    });
  });

  describe('Root with multiple relationships', () => {
    it('should handle multiple one-to-one forward relationships correctly (LEFT JOIN)', async () => {
      // ARRANGE
      const profileRelation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const settingsRelation = createOneToOneForwardRelation(
        'settings',
        TestSettingsService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '10' }, [
        profileRelation,
        settingsRelation,
      ]);

      // Use data helper for consistent test data
      const data = createMultiRelationSet();
      // Extend with additional roots for this test
      const rootData = [
        ...data.roots,
        { id: 3, name: 'Root 3' },
        { id: 4, name: 'Root 4' },
        { id: 5, name: 'Root 5' },
      ];

      // Custom profile and settings data for this complex scenario
      const profileData: TestProfile[] = [
        { id: 1, rootId: 1, bio: 'Profile 1', avatar: 'avatar1.jpg' }, // from data helper
        { id: 2, rootId: 3, bio: 'Profile for Root 3' },
        {
          id: 3,
          rootId: 4,
          bio: 'Profile for Root 4',
          avatar: 'avatar4.jpg',
        },
        // Roots 2 and 5 have no profiles
      ];

      const settingsData: TestSettings[] = [
        { id: 1, rootId: 1, theme: 'dark', notifications: true }, // from data helper
        { id: 2, rootId: 2, theme: 'light', notifications: false }, // from data helper
        { id: 3, rootId: 5, theme: 'auto', notifications: true },
        // Roots 3 and 4 have no settings
      ];

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(rootData, { limit: 10, total: 5 }),
      );
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse(profileData, { total: 3 }),
      );
      mocks.mockSettingsService.getMany.mockResolvedValue(
        createPaginatedResponse(settingsData, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockProfileService, count: 1 },
        { service: mocks.mockSettingsService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [
        mocks.mockProfileService,
        mocks.mockSettingsService,
      ]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 10,
      });

      // Verify profile service called with all root IDs
      const profileRequest = mocks.mockProfileService.getMany.mock.calls[0][0];
      expect(profileRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2, 3, 4, 5] },
      });

      // Verify settings service called with all root IDs
      const settingsRequest =
        mocks.mockSettingsService.getMany.mock.calls[0][0];
      expect(settingsRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2, 3, 4, 5] },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 5 });

      // Verify profile enrichment
      assertOneToOneEnrichment(result, 'profile', {
        1: { id: 1, rootId: 1, bio: 'Profile 1', avatar: 'avatar1.jpg' },
        2: null,
        3: { id: 2, rootId: 3, bio: 'Profile for Root 3' },
        4: {
          id: 3,
          rootId: 4,
          bio: 'Profile for Root 4',
          avatar: 'avatar4.jpg',
        },
        5: null,
      });

      // Verify settings enrichment
      assertOneToOneEnrichment(result, 'settings', {
        1: { id: 1, rootId: 1, theme: 'dark', notifications: true },
        2: { id: 2, rootId: 2, theme: 'light', notifications: false },
        3: null,
        4: null,
        5: { id: 3, rootId: 5, theme: 'auto', notifications: true },
      });
    });
  });

  describe('Pagination handling', () => {
    it('should handle page 1 pagination with profile enrichment (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const req = mocks.createTestRequest({ page: '1', limit: '5' }, [
        relation,
      ]);

      // Create test data for pagination - page 1 (roots 1-5)
      const rootData = [
        { id: 1, name: 'Root 1' },
        { id: 2, name: 'Root 2' },
        { id: 3, name: 'Root 3' },
        { id: 4, name: 'Root 4' },
        { id: 5, name: 'Root 5' },
      ];

      const profileData: TestProfile[] = [
        {
          id: 1,
          rootId: 1,
          bio: 'Profile for Root 1',
          avatar: 'avatar1.jpg',
        },
        { id: 2, rootId: 3, bio: 'Profile for Root 3' },
        {
          id: 3,
          rootId: 5,
          bio: 'Profile for Root 5',
          avatar: 'avatar5.jpg',
        },
        // Roots 2 and 4 have no profiles
      ];

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(rootData, { limit: 5, total: 10 }),
      );
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse(profileData, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockProfileService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockProfileService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 1,
        limit: 5,
      });

      // Verify root pagination parameters
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.page).toBe(1);
      expect(rootCall.parsed.limit).toBe(5);

      // Verify profile service called with page 1 root IDs
      const profileRequest = mocks.mockProfileService.getMany.mock.calls[0][0];
      expect(profileRequest.parsed.search).toEqual({
        rootId: { $in: [1, 2, 3, 4, 5] },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 10 });
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(2);

      // Verify profile enrichment for page 1
      assertOneToOneEnrichment(result, 'profile', {
        1: {
          id: 1,
          rootId: 1,
          bio: 'Profile for Root 1',
          avatar: 'avatar1.jpg',
        },
        2: null,
        3: { id: 2, rootId: 3, bio: 'Profile for Root 3' },
        4: null,
        5: {
          id: 3,
          rootId: 5,
          bio: 'Profile for Root 5',
          avatar: 'avatar5.jpg',
        },
      });
    });

    it('should handle page 2 pagination with profile enrichment (LEFT JOIN)', async () => {
      // ARRANGE
      const relation = createOneToOneForwardRelation(
        'profile',
        TestProfileService,
      );
      const req = mocks.createTestRequest({ page: '2', limit: '5' }, [
        relation,
      ]);

      // Create test data for pagination - page 2 (roots 6-10)
      const rootData = [
        { id: 6, name: 'Root 6' },
        { id: 7, name: 'Root 7' },
        { id: 8, name: 'Root 8' },
        { id: 9, name: 'Root 9' },
        { id: 10, name: 'Root 10' },
      ];

      const profileData: TestProfile[] = [
        { id: 4, rootId: 6, bio: 'Profile for Root 6' },
        {
          id: 5,
          rootId: 8,
          bio: 'Profile for Root 8',
          avatar: 'avatar8.jpg',
        },
        {
          id: 6,
          rootId: 10,
          bio: 'Profile for Root 10',
          avatar: 'avatar10.jpg',
        },
        // Roots 7 and 9 have no profiles
      ];

      mocks.mockRootService.getMany.mockResolvedValue(
        createPaginatedResponse(rootData, { limit: 5, total: 10 }),
      );
      mocks.mockProfileService.getMany.mockResolvedValue(
        createPaginatedResponse(profileData, { total: 3 }),
      );

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Service call verification
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 1 },
        { service: mocks.mockProfileService, count: 1 },
      ]);
      assertRootFirst(mocks.mockRootService, [mocks.mockProfileService]);
      assertLeftJoinBehavior(mocks.mockRootService);

      // Verify root service parameters
      assertRootGetManyRequest(mocks.mockRootService, {
        page: 2,
        limit: 5,
      });

      // Verify root pagination parameters
      const rootCall = mocks.mockRootService.getMany.mock.calls[0][0];
      expect(rootCall.parsed.page).toBe(2);
      expect(rootCall.parsed.limit).toBe(5);

      // Verify profile service called with page 2 root IDs
      const profileRequest = mocks.mockProfileService.getMany.mock.calls[0][0];
      expect(profileRequest.parsed.search).toEqual({
        rootId: { $in: [6, 7, 8, 9, 10] },
      });

      // ASSERT - Result verification
      assertResultStructure(result, { count: 5, total: 10 });
      expect(result.page).toBe(2);
      expect(result.pageCount).toBe(2);

      // Verify profile enrichment for page 2
      assertOneToOneEnrichment(result, 'profile', {
        6: { id: 4, rootId: 6, bio: 'Profile for Root 6' },
        7: null,
        8: {
          id: 5,
          rootId: 8,
          bio: 'Profile for Root 8',
          avatar: 'avatar8.jpg',
        },
        9: null,
        10: {
          id: 6,
          rootId: 10,
          bio: 'Profile for Root 10',
          avatar: 'avatar10.jpg',
        },
      });
    });
  });
});
