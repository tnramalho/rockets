import { InjectionToken } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

import { CrudControllerOptionsInterface } from '../../crud/interfaces/crud-controller-options.interface';
import { CrudExtraDecoratorsInterface } from '../../crud/interfaces/crud-extra-decorators.interface';
import {
  CrudCreateManyOptionsInterface,
  CrudCreateOneOptionsInterface,
  CrudDeleteOneOptionsInterface,
  CrudReadAllOptionsInterface,
  CrudReadOneOptionsInterface,
  CrudRecoverOneOptionsInterface,
  CrudReplaceOneOptionsInterface,
  CrudUpdateOneOptionsInterface,
} from '../../crud/interfaces/crud-route-options.interface';

export interface ConfigurableCrudOptions {
  service: { injectionToken: InjectionToken } & (
    | { entity: EntityClassOrSchema; entityKey?: never }
    | { entityKey: string; entity?: never }
  );
  controller: CrudControllerOptionsInterface & CrudExtraDecoratorsInterface;
  getMany?: CrudReadAllOptionsInterface & CrudExtraDecoratorsInterface;
  getOne?: CrudReadOneOptionsInterface & CrudExtraDecoratorsInterface;
  createMany?: CrudCreateManyOptionsInterface & CrudExtraDecoratorsInterface;
  createOne?: CrudCreateOneOptionsInterface & CrudExtraDecoratorsInterface;
  updateOne?: CrudUpdateOneOptionsInterface & CrudExtraDecoratorsInterface;
  replaceOne?: CrudReplaceOneOptionsInterface & CrudExtraDecoratorsInterface;
  deleteOne?: CrudDeleteOneOptionsInterface & CrudExtraDecoratorsInterface;
  recoverOne?: CrudRecoverOneOptionsInterface & CrudExtraDecoratorsInterface;
}
