import { PlainLiteralObject } from '@nestjs/common';

import { CrudRequestInterface } from '../../crud/interfaces/crud-request.interface';
import { CrudResponsePaginatedInterface } from '../../crud/interfaces/crud-response-paginated.interface';

/**
 * Interface for services that can fetch entities using CRUD requests
 */
export interface CrudFetchServiceInterface<
  Entity extends PlainLiteralObject = PlainLiteralObject,
> {
  getMany(
    req: CrudRequestInterface<Entity>,
  ): Promise<CrudResponsePaginatedInterface<Entity>>;

  getOne(req: CrudRequestInterface<Entity>): Promise<Entity>;
}
