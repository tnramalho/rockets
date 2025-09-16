import { PlainLiteralObject } from '@nestjs/common';

import { CrudEntityColumn } from '../../crud.types';
import { QueryRelation } from '../../request/types/crud-request-query.types';

export interface CrudRelationsInterface<
  Entity extends PlainLiteralObject,
  Relations extends PlainLiteralObject[],
> {
  rootKey: CrudEntityColumn<Entity>;
  relations: {
    [K in keyof Relations]: QueryRelation<Entity, Relations[K]>;
  };
}
