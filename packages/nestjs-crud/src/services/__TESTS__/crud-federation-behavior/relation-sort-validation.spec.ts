import { CrudFederationException } from '../../../exceptions/crud-federation.exception';
import {
  assertServiceCallCounts,
  assertRelationSortValidationError,
} from '../../__FIXTURES__/crud-federation-test-assertions';
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
 * Validation tests for relation sort requirements (Scenario 14)
 * Relation sort requires specific $notnull filter on join key to ensure INNER JOIN semantics
 * Tests various invalid configurations and validates helpful error messages
 */
describe('CrudFederationService - Behavior: Relation Sort Validation', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
    // Register the 'relations' relation that tests use
    mocks.registerRelation(mocks.mockRelationService);
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('Forward relationship validation', () => {
    it('should throw error when relation sort lacks any filters', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          sort: ['relations.title,ASC'], // No filters - will error!
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      assertRelationSortValidationError(error);

      // No services should be called when validation fails
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 0 },
      ]);
    });

    it('should throw error when relation sort has unrelated relation filters only', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.status||$eq||active'], // Unrelated filter, missing $notnull
          sort: ['relations.priority,DESC'],
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      assertRelationSortValidationError(error);

      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 0 },
      ]);
    });

    it('should throw error when relation sort has non-notnull filter', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          // This should trigger the validation error since no $notnull filter exists
          filter: ['relations.status||$eq||active'],
          sort: ['relations.title,ASC'],
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      expect(error).toBeInstanceOf(CrudFederationException);
      expect(error.message).toContain('distinctFilter configuration');

      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 0 },
      ]);
    });

    it('should throw error when relation sort has AND filter on non-join field only', async () => {
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
          ], // No join key filter
          sort: ['relations.createdAt,DESC'],
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      assertRelationSortValidationError(error);

      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 },
        { service: mocks.mockRelationService, count: 0 },
      ]);
    });

    it('should provide helpful error message with join key filter suggestion', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          sort: ['relations.priority,DESC'],
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      expect(error).toBeInstanceOf(CrudFederationException);
      expect(error.message).toContain('distinctFilter configuration');
      // The error message now suggests using distinctFilter configuration
    });
  });

  describe('Mixed filter scenarios', () => {
    it('should throw error when root filters exist but no relation join key filter', async () => {
      // ARRANGE
      const relation = createOneToManyForwardRelation(
        'relations',
        TestRelationService,
      );
      const req = mocks.createTestRequest(
        {
          filter: ['name||$cont||Project'], // Root filter only
          sort: ['relations.title,ASC'], // Relation sort
        },
        [relation],
      );

      // ACT & ASSERT
      const error = await mocks.service.getMany(req).catch((e) => e);

      assertRelationSortValidationError(error);
    });
  });

  describe('Valid configurations (should not throw)', () => {
    it('should not throw error when valid $notnull filter exists', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { isLatest: { $eq: true } }, // distinctFilter configuration
      );
      const req = mocks.createTestRequest(
        {
          filter: ['relations.rootId||$notnull'], // Valid filter
          sort: ['relations.title,ASC'],
        },
        [relation],
      );

      // Mock empty responses to avoid actual fetch logic
      mocks.mockRelationService.getMany.mockResolvedValue({
        data: [],
        count: 0,
        total: 0,
        page: 1,
        pageCount: 0,
        limit: 100,
      });

      // ACT - Should not throw
      const result = await mocks.service.getMany(req);

      // ASSERT - Validation passed, relation service called
      expect(result.data).toEqual([]);
      assertServiceCallCounts([
        { service: mocks.mockRootService, count: 0 }, // No roots when no relations
        { service: mocks.mockRelationService, count: 1 },
      ]);
    });

    it('should not throw error when valid $notnull filter exists with additional filters', async () => {
      // ARRANGE
      const relation = createOneToManyWithDistinctFilter(
        'relations',
        TestRelationService,
        { isLatest: { $eq: true } }, // distinctFilter configuration
      );
      const req = mocks.createTestRequest(
        {
          filter: [
            'relations.rootId||$notnull', // Valid join key filter
            'relations.status||$eq||active', // Additional filter OK
          ],
          sort: ['relations.priority,DESC'],
        },
        [relation],
      );

      // Mock empty responses
      mocks.mockRelationService.getMany.mockResolvedValue({
        data: [],
        count: 0,
        total: 0,
        page: 1,
        pageCount: 0,
        limit: 100,
      });

      // ACT - Should not throw
      const result = await mocks.service.getMany(req);

      // ASSERT - Validation passed
      expect(result.data).toEqual([]);
      assertServiceCallCounts([
        { service: mocks.mockRelationService, count: 1 },
      ]);
    });
  });
});
