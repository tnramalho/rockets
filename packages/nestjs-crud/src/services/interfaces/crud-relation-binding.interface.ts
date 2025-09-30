import { PlainLiteralObject } from '@nestjs/common';

import { QueryRelation } from '../../request/types/crud-request-query.types';

import { CrudFetchServiceInterface } from './crud-fetch-service.interface';

/**
 * Represents a binding between a CRUD service and a relation configuration.
 *
 * This interface combines a service instance with its corresponding relation metadata
 * to enable federated data fetching across related entities. Each binding represents
 * a complete configuration for fetching and enriching data from a relation entity.
 */
export interface CrudRelationBindingInterface<
  Root extends PlainLiteralObject,
  Relation extends PlainLiteralObject,
> {
  /** The CRUD service responsible for fetching relation entities */
  service: CrudFetchServiceInterface<Relation>;
  /** The relation configuration defining how root and relation entities are connected */
  relation: QueryRelation<Root, Relation>;
}
