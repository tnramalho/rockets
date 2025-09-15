import { PlainLiteralObject, SetMetadata } from '@nestjs/common';

import { CRUD_MODULE_ROUTE_RELATIONS_METADATA } from '../../../crud.constants';
import { CrudRelationsInterface } from '../../interfaces/crud-relations.interface';

/**
 * CRUD Relations route decorator.
 *
 * Configure relationship properties for hydrating sub-properties based on raw
 * foreign keys.
 */
export const CrudRelations = <
  Entity extends PlainLiteralObject = PlainLiteralObject,
  Relations extends PlainLiteralObject[] = PlainLiteralObject[],
>(
  relations: CrudRelationsInterface<Entity, Relations>,
) => SetMetadata(CRUD_MODULE_ROUTE_RELATIONS_METADATA, relations);
