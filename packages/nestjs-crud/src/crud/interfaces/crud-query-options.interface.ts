import { PlainLiteralObject } from '@nestjs/common';

import {
  QueryFields,
  QuerySort,
} from '../../request/types/crud-request-query.types';
import { QueryFilterOption } from '../types/query-filter-option.type';

import { CrudRelationsInterface } from './crud-relations.interface';

export interface CrudQueryOptionsInterface<
  T extends PlainLiteralObject,
  Relations extends PlainLiteralObject[] = PlainLiteralObject[],
> {
  allow?: QueryFields<T>;
  exclude?: QueryFields<T>;
  persist?: QueryFields<T>;
  filter?: QueryFilterOption<T>;
  sort?: QuerySort<T>[];
  limit?: number;
  maxLimit?: number;
  cache?: number | false;
  alwaysPaginate?: boolean;
  softDelete?: boolean;
  relations?: CrudRelationsInterface<T, Relations>;
}
