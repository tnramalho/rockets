import { PlainLiteralObject, Type } from '@nestjs/common';

import { CrudRelationsInterface } from '../../crud/interfaces/crud-relations.interface';
import { CrudRequestParsedParamsInterface } from '../../request/interfaces/crud-request-parsed-params.interface';
import { QueryRelation } from '../../request/types/crud-request-query.types';
import { CrudQueryHelper } from '../helpers/crud-query.helper';

// Mock entities
export interface TestRoot extends PlainLiteralObject {
  id: number;
  name: string;
  companyId?: number;
}

export interface TestRelation extends PlainLiteralObject {
  id: number;
  rootId: number;
  title: string;
  priority?: number;
  status?: string;
  isLatest?: boolean;
}

export interface TestProfile extends PlainLiteralObject {
  id: number;
  rootId: number;
  bio: string;
  avatar?: string;
}

export interface TestSettings extends PlainLiteralObject {
  id: number;
  rootId: number;
  theme: string;
  notifications: boolean;
}

// Mock service classes
export class TestRootService {}
export class TestRelationService {}
export class TestProfileService {}
export class TestSettingsService {}

// Factory functions for creating test data
export const createTestParsed = (
  overrides: Partial<CrudRequestParsedParamsInterface<TestRoot>> = {},
): CrudRequestParsedParamsInterface<TestRoot> => {
  const queryHelper = new CrudQueryHelper<TestRoot>();
  const baseRequest = queryHelper.createRequest();
  return {
    ...baseRequest.parsed,
    ...overrides,
  };
};

export const createTestRelations = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  relations: QueryRelation<TestRoot, any>[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): CrudRelationsInterface<TestRoot, any[]> => ({
  rootKey: 'id',
  relations,
});

// Common relation configurations
export const createOneToManyForwardRelation = (
  property: string,
  service: Type,
  primaryKey: string = 'id',
  foreignKey: string = 'rootId',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): QueryRelation<TestRoot, any> => ({
  property,
  primaryKey,
  foreignKey,
  cardinality: 'many',
  service,
  owner: false,
});

export const createOneToOneForwardRelation = (
  property: string,
  service: Type,
  primaryKey: string = 'id',
  foreignKey: string = 'rootId',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): QueryRelation<TestRoot, any> => ({
  property,
  primaryKey,
  foreignKey,
  cardinality: 'one',
  service,
  owner: false,
});

export const createOneToManyWithDistinctFilter = (
  property: string,
  service: Type,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  distinctFilter: any, // QueryFilter for the relation
  primaryKey: string = 'id',
  foreignKey: string = 'rootId',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): QueryRelation<TestRoot, any> => ({
  property,
  primaryKey,
  foreignKey,
  cardinality: 'many',
  service,
  owner: false,
  distinctFilter,
});
