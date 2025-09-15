import { CrudFederationException } from '../../../exceptions/crud-federation.exception';
import {
  createOneToManyForwardRelation,
  createOneToManyWithDistinctFilter,
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
          filter: ['relations.rootId||$notnull'], // Has $notnull but no distinctFilter
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
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true },
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'], // Has required $notnull
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
      const relationCall = mocks.mockRelationService.getMany.mock.calls[0][0];
      expect(relationCall.parsed.filter).toEqual(
        expect.arrayContaining([
          { field: 'isLatest', operator: '$eq', value: true },
        ]),
      );
    });

    it('should still require $notnull filter even with distinctFilter (Option B)', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { field: 'isLatest', operator: '$eq', value: true },
      );
      const req = mocks.createTestRequest(
        {
          // Missing $notnull filter (testing Option B: both required)
          sort: ['relations.title,ASC'],
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      expect(error).toBeInstanceOf(CrudFederationException);
      expect(error.message).toContain('$notnull');
      expect(error.message).toContain('join key');
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
