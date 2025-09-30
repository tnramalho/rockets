import { PlainLiteralObject } from '@nestjs/common';

import {
  QueryFilter,
  SCondition,
} from '../../request/types/crud-request-query.types';

export type QueryFilterOption<T extends PlainLiteralObject> =
  | QueryFilter<T>[]
  | SCondition<T>;
