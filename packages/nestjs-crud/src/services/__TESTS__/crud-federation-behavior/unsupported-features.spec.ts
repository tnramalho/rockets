import { CrudFederationException } from '../../../exceptions/crud-federation.exception';
import {
  setupCrudFederationTests,
  cleanupCrudFederationTests,
  CrudFederationTestMocks,
} from '../../__FIXTURES__/crud-federation-test-setup';

describe('CrudFederationService - Unsupported Features Validation', () => {
  let mocks: CrudFederationTestMocks;

  beforeEach(async () => {
    mocks = await setupCrudFederationTests();
  });

  afterEach(async () => {
    await cleanupCrudFederationTests(mocks);
  });

  describe('OR filter via query string validation', () => {
    it('should throw error when req.parsed.or has filters', async () => {
      const req = mocks.createTestRequest();
      req.parsed.or = [{ field: 'name', operator: '$cont', value: 'test' }];

      await expect(mocks.service.getMany(req)).rejects.toThrow(
        'OR filter via query string is not supported in CRUD federation. ' +
          'Use AND filter conditions instead.',
      );

      expect(mocks.mockRootService.getMany).not.toHaveBeenCalled();
    });

    it('should not throw error when req.parsed.or is empty array', async () => {
      const req = mocks.createTestRequest();
      req.parsed.or = [];

      // Should not throw CrudFederationException for empty or array
      try {
        await mocks.service.getMany(req);
      } catch (error) {
        expect(error).not.toBeInstanceOf(CrudFederationException);
      }
    });
  });
});
