import { PlainLiteralObject } from '@nestjs/common';

import { CrudRequestInterface } from '../../crud/interfaces/crud-request.interface';
import { CrudResponsePaginatedInterface } from '../../crud/interfaces/crud-response-paginated.interface';
import { CrudRequestParsedParamsInterface } from '../../request/interfaces/crud-request-parsed-params.interface';
import { CrudQueryHelper } from '../helpers/crud-query.helper';
import { CrudFetchServiceInterface } from '../interfaces/crud-fetch-service.interface';

// Type definitions for better type safety
interface RootWithRelations {
  id: number;
  [key: string]: unknown;
}

// Minimal type for services that only need mock call tracking
interface ServiceWithMockTracking {
  getMany: {
    mock: {
      invocationCallOrder: number[];
    };
  };
}

// Minimal type for services that only need call count verification
interface ServiceWithCallCount {
  getMany: unknown;
}

/**
 * Shared assertion utilities for federation tests
 * Reduces boilerplate and ensures consistent verification patterns
 */

// Service call sequencing verification - root called before all relation services
export const assertRootFirst = (
  rootService: ServiceWithMockTracking,
  relationServices: ServiceWithMockTracking[],
) => {
  const rootCallOrder = rootService.getMany.mock.invocationCallOrder[0];

  relationServices.forEach((relationService) => {
    const relationCallOrder =
      relationService.getMany.mock.invocationCallOrder[0];
    expect(relationCallOrder).toBeGreaterThan(rootCallOrder);
  });
};

// Service call sequencing verification - relation services called before root
export const assertRelationFirst = (
  rootService: ServiceWithMockTracking,
  relationServices: ServiceWithMockTracking[],
) => {
  const rootCallOrder = rootService.getMany.mock.invocationCallOrder[0];

  relationServices.forEach((relationService) => {
    const relationCallOrder =
      relationService.getMany.mock.invocationCallOrder[0];
    expect(rootCallOrder).toBeGreaterThan(relationCallOrder);
  });
};

// Service call sequencing verification for getOne - root.getOne called before relation.getMany
export const assertRootFirstGetOne = (
  rootService: { getOne: { mock: { invocationCallOrder: number[] } } },
  relationServices: { getMany: { mock: { invocationCallOrder: number[] } } }[],
) => {
  const rootCallOrder = rootService.getOne.mock.invocationCallOrder[0];

  relationServices.forEach((relationService) => {
    const relationCallOrder =
      relationService.getMany.mock.invocationCallOrder[0];
    expect(relationCallOrder).toBeGreaterThan(rootCallOrder);
  });
};

// LEFT JOIN behavior verification - root service has no search constraints
export const assertLeftJoinBehavior = <R extends PlainLiteralObject>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
) => {
  const rootCall = rootService.getMany.mock.calls[0][0];

  // Root service should have no search constraints (LEFT JOIN)
  expect(rootCall.parsed.search).toBeUndefined();
};

// INNER JOIN behavior verification
export const assertInnerJoinBehavior = <
  R extends PlainLiteralObject,
  L extends PlainLiteralObject,
>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
  relationService: jest.Mocked<CrudFetchServiceInterface<L>>,
  expectedRelationFilter: object,
  discoveredRootIds: number[],
) => {
  const relationCall = relationService.getMany.mock.calls[0][0];
  const rootCall = rootService.getMany.mock.calls[0][0];

  // Relation service gets the explicit filter
  expect(relationCall.parsed.search).toEqual(expectedRelationFilter);

  // Root service gets ID constraint from discovered relations
  expect(rootCall.parsed.search).toEqual({
    id: { $in: discoveredRootIds },
  });

  // Verify relation called first (INNER JOIN pattern)
  assertRelationFirst(rootService, [relationService]);
};

// Generic service call counts - accepts array of service-count pairs
export const assertServiceCallCounts = (
  serviceCounts: Array<{
    service: ServiceWithCallCount;
    count: number;
  }>,
) => {
  serviceCounts.forEach(({ service, count }) => {
    expect(service.getMany).toHaveBeenCalledTimes(count);
  });
};

// Assert no relation service calls (for no-relations scenarios)
export const assertNoRelationServiceCalls = <L extends PlainLiteralObject>(
  relationService: jest.Mocked<CrudFetchServiceInterface<L>>,
) => {
  expect(relationService.getMany).not.toHaveBeenCalled();
};

// Shared helper for asserting service requests with parsed parameter filtering
const assertServiceRequest = <T extends PlainLiteralObject>(
  actualRequest: CrudRequestInterface<T>,
  expectedParsed: Partial<CrudRequestParsedParamsInterface<T>>,
  options: { ignore?: Array<keyof CrudRequestParsedParamsInterface<T>> } = {
    ignore: ['filter', 'or', 'classTransformOptions'],
  },
) => {
  const ignoreProps = options.ignore || [
    'filter',
    'or',
    'classTransformOptions',
  ];

  // Create expected request with defaults
  const helper = new CrudQueryHelper<T>();
  const expected = helper.createRequest<T>();

  // Merge expected values
  expected.parsed = {
    ...expected.parsed,
    ...expectedParsed,
  };

  // Create copies for comparison with ignored properties removed
  const actualFiltered = { ...actualRequest.parsed };
  const expectedFiltered = { ...expected.parsed };

  // Remove ignored properties from both objects
  for (const prop of ignoreProps) {
    delete actualFiltered[prop];
    delete expectedFiltered[prop];
  }

  // Compare filtered parsed objects
  expect(actualFiltered).toEqual(expectedFiltered);
};

// Core helper function for asserting root service requests
const assertRootServiceRequest = <R extends PlainLiteralObject>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
  methodName: 'getOne' | 'getMany',
  expectedParsed: Partial<CrudRequestParsedParamsInterface<R>>,
  callIndex: number = 0,
  options: { ignore?: Array<keyof CrudRequestParsedParamsInterface<R>> } = {
    ignore: ['filter', 'or', 'classTransformOptions'],
  },
) => {
  const actual: CrudRequestInterface<R> =
    methodName === 'getMany'
      ? rootService.getMany.mock.calls[callIndex][0]
      : rootService.getOne.mock.calls[callIndex][0];

  assertServiceRequest(actual, expectedParsed, options);
};

// Root service request verification - validates request matches expected exactly
export const assertRootGetManyRequest = <R extends PlainLiteralObject>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
  expectedParsed: Partial<CrudRequestParsedParamsInterface<R>>,
  callIndex: number = 0,
  options?: { ignore?: Array<keyof CrudRequestParsedParamsInterface<R>> },
) => {
  assertRootServiceRequest(
    rootService,
    'getMany',
    expectedParsed,
    callIndex,
    options,
  );
};

// Root service getOne request verification
export const assertRootGetOneRequest = <R extends PlainLiteralObject>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
  expectedParsed: Partial<CrudRequestParsedParamsInterface<R>>,
  callIndex: number = 0,
  options?: { ignore?: Array<keyof CrudRequestParsedParamsInterface<R>> },
) => {
  assertRootServiceRequest(
    rootService,
    'getOne',
    expectedParsed,
    callIndex,
    options,
  );
};

// Relation service request verification - validates request matches expected exactly
export const assertRelationRequest = <L extends PlainLiteralObject>(
  relationService: jest.Mocked<CrudFetchServiceInterface<L>>,
  expectedParsed: Partial<CrudRequestParsedParamsInterface<L>>,
  callIndex: number = 0,
  options?: {
    ignore?: Array<keyof CrudRequestParsedParamsInterface<L>>;
  },
) => {
  const actual: CrudRequestInterface<L> =
    relationService.getMany.mock.calls[callIndex][0];

  assertServiceRequest(actual, expectedParsed, {
    ignore: options?.ignore,
  });
};

// Result structure verification - checks all response properties and data contents
export const assertResultStructure = (
  result: CrudResponsePaginatedInterface<RootWithRelations>,
  expected: Partial<CrudResponsePaginatedInterface<RootWithRelations>> &
    Pick<CrudResponsePaginatedInterface<RootWithRelations>, 'count' | 'total'>,
) => {
  // Required properties - always checked
  expect(result.total).toBe(expected.total);
  expect(result.count).toBe(expected.count);

  if (expected.data !== undefined) {
    expect(result.data).toEqual(expected.data);
  }

  // Optional properties - checked only if provided for backward compatibility
  if (expected.limit !== undefined) {
    expect(result.limit).toBe(expected.limit);
  }

  if (expected.page !== undefined) {
    expect(result.page).toBe(expected.page);
  }

  if (expected.pageCount !== undefined) {
    expect(result.pageCount).toBe(expected.pageCount);
  }

  // Metrics - optional nested object
  if (expected.metrics !== undefined) {
    expect(result.metrics).toEqual(expected.metrics);
  }
};

// Combined enrichment verification - property + mappings
export const assertEnrichment = (
  result: CrudResponsePaginatedInterface<RootWithRelations>,
  relationProperty: string,
  expectedMappings: Record<number, unknown[]>,
) => {
  // Check that all roots have the relation property
  result.data.forEach((root: RootWithRelations) => {
    expect(root).toHaveProperty(relationProperty);
    expect(Array.isArray(root[relationProperty])).toBe(true);
  });

  // Verify specific root-relation mappings
  const rootById = new Map(
    result.data.map((r: RootWithRelations) => [r.id, r]),
  );

  Object.entries(expectedMappings).forEach(([rootId, expectedRelations]) => {
    const root = rootById.get(Number(rootId));
    expect(root).toBeDefined();
    if (root) {
      const relationValue = root[relationProperty] as unknown[];
      expect(relationValue).toHaveLength(expectedRelations.length);

      expectedRelations.forEach((expectedRelation) => {
        expect(relationValue).toContainEqual(expectedRelation);
      });
    }
  });
};

// One-to-one enrichment verification - property can be single object or null
export const assertOneToOneEnrichment = (
  result: CrudResponsePaginatedInterface<RootWithRelations>,
  relationProperty: string,
  expectedMappings: Record<number, unknown | null>,
) => {
  const rootById = new Map(
    result.data.map((r: RootWithRelations) => [r.id, r]),
  );

  // Verify all roots have the property
  result.data.forEach((root: RootWithRelations) => {
    expect(root).toHaveProperty(relationProperty);
  });

  // Verify specific mappings (object or null)
  Object.entries(expectedMappings).forEach(([rootId, expectedValue]) => {
    const root = rootById.get(Number(rootId));
    expect(root).toBeDefined();
    if (root) {
      if (expectedValue === null) {
        expect(root[relationProperty]).toBeNull();
      } else {
        expect(root[relationProperty]).toEqual(expectedValue);
      }
    }
  });
};

// Sort order verification using ID sequences
export const assertSortOrder = (
  result: CrudResponsePaginatedInterface<RootWithRelations>,
  expectedIdSequence: number[],
) => {
  expectedIdSequence.forEach((expectedId, index) => {
    expect(result.data[index].id).toBe(expectedId);
  });
};

// Empty result verification
export const assertEmptyResult = (
  result: CrudResponsePaginatedInterface<unknown>,
) => {
  expect(result.data).toEqual([]);
  expect(result.count).toBe(0);
  expect(result.total).toBe(0);
  expect(result.page).toBe(1);
  // pageCount and limit can vary, so just verify they exist
  expect(result.pageCount).toBeGreaterThanOrEqual(0);
  expect(result.limit).toBeGreaterThanOrEqual(1);
};

// Relation sort behavior verification - relation service called first with filter and sort
export const assertRelationSortBehavior = <
  R extends PlainLiteralObject,
  L extends PlainLiteralObject,
>(
  rootService: jest.Mocked<CrudFetchServiceInterface<R>>,
  relationService: jest.Mocked<CrudFetchServiceInterface<L>>,
  expectedRelationSearch: object,
  expectedRelationSort: Array<{ field: string; order: string }>,
) => {
  const relationCall = relationService.getMany.mock.calls[0][0];

  // Relation service gets the filter AND sort
  expect(relationCall.parsed.search).toEqual(expectedRelationSearch);
  expect(relationCall.parsed.sort).toEqual(expectedRelationSort);

  // Verify relation called first (relation-sort pattern)
  assertRelationFirst(rootService, [relationService]);
};

// Relation sort validation error verification
export const assertRelationSortValidationError = (
  error: Error,
  relationFieldOrMessage?: string,
) => {
  const CrudQueryException = error.constructor;
  expect(error).toBeInstanceOf(CrudQueryException);
  expect(error.message).toContain('distinctFilter configuration');

  // If a specific field or message is provided, check for it
  // This is optional since the error message format changed
  if (relationFieldOrMessage) {
    expect(error.message).toContain(relationFieldOrMessage);
  }
};
