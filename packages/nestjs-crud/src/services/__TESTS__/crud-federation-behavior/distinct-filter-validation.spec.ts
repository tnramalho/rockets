import { CrudFederationException } from '../../../exceptions/crud-federation.exception';
import { assertRelationRequest } from '../../__FIXTURES__/crud-federation-test-assertions';
import {
  createOneToManyForwardRelation,
  createOneToOneForwardRelation,
  TestRelationService,
} from '../../__FIXTURES__/crud-federation-test-entities';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

/**
 * Validation tests for distinctFilter requirements on many-cardinality relations
 * Tests that relation sorting requires distinctFilter for many relationships
 */
describe('CrudFederationService - Behavior: distinctFilter Validation', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('distinctFilter requirement validation', () => {
    it('should throw error when many-cardinality relation lacks distinctFilter', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      // Remove distinctFilter to test validation
      const req = mocks.createTestRequest(
        {
          sort: ['relations.title,ASC'], // Trying to sort by relation field
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      expect(error).toBeInstanceOf(CrudFederationException);
      expect(error.message).toContain(
        'requires a distinctFilter configuration',
      );
      expect(error.message).toContain('many-cardinality relationship');
    });

    it('should succeed when many-cardinality relation has distinctFilter and $notnull', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          sort: ['relations.title,ASC'], // Sorting by relation field
          limit: '3',
        },
        [relation],
      );

      // Mock data
      const relationData = [
        { id: 1, rootId: 1, title: 'Alpha Task', isLatest: true },
        { id: 2, rootId: 2, title: 'Beta Task', isLatest: true },
        { id: 3, rootId: 3, title: 'Charlie Task', isLatest: true },
      ];
      const rootData = [
        { id: 1, name: 'Root 1' },
        { id: 2, name: 'Root 2' },
        { id: 3, name: 'Root 3' },
      ];

      mocks.mockRelationService.getMany.mockResolvedValue({
        data: relationData,
        count: 3,
        total: 3,
        page: 1,
        pageCount: 1,
        limit: 3,
      });

      mocks.mockRootService.getMany.mockResolvedValue({
        data: rootData,
        count: 3,
        total: 3,
        page: 1,
        pageCount: 1,
        limit: 3,
      });

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);

      // Verify distinctFilter was applied
      assertRelationRequest(mocks.mockRelationService, {
        filter: [
          {
            field: 'isLatest',
            operator: '$eq',
            value: true,
            relation: 'relations',
          },
        ],
        limit: 3,
        offset: 0,
        search: {
          $and: [{ rootId: { $notnull: true } }, { isLatest: { $eq: true } }],
        },
        sort: [{ field: 'title', order: 'ASC' }],
      });
    });

    it('should automatically inject $notnull filter for relation sorting', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
        { distinctFilter: { field: 'isLatest', operator: '$eq', value: true } },
      );
      const req = mocks.createTestRequest(
        {
          // No $notnull filter provided - system should inject it automatically
          sort: ['relations.title,ASC'],
        },
        [relation],
      );

      // Mock data
      mocks.mockRelationService.getMany.mockResolvedValue({
        data: [{ id: 1, rootId: 1, title: 'Test Relation', isLatest: true }],
        count: 1,
        total: 1,
        page: 1,
        pageCount: 1,
        limit: 1,
      });

      mocks.mockRootService.getMany.mockResolvedValue({
        data: [{ id: 1, name: 'Root 1' }],
        count: 1,
        total: 1,
        page: 1,
        pageCount: 1,
        limit: 1,
      });

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT - Should succeed because $notnull filter was automatically injected
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
    });

    it('should work fine with one-cardinality relations (no distinctFilter needed)', async () => {
      // ARRANGE - Using createOneToOneForwardRelation for proper typing
      const relation = createOneToOneForwardRelation(
        'profile',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          sort: ['profile.title,ASC'], // No distinctFilter needed for one-to-one
        },
        [relation],
      );

      // Mock data
      mocks.mockRelationService.getMany.mockResolvedValue({
        data: [{ id: 1, rootId: 1, title: 'Developer Profile' }],
        count: 1,
        total: 1,
        page: 1,
        pageCount: 1,
        limit: 1,
      });

      mocks.mockRootService.getMany.mockResolvedValue({
        data: [{ id: 1, name: 'Root 1' }],
        count: 1,
        total: 1,
        page: 1,
        pageCount: 1,
        limit: 1,
      });

      // ACT
      const result = await mocks.service.getMany(req);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
    });
  });
});
