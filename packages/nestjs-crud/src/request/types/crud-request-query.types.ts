import { PlainLiteralObject, Type } from '@nestjs/common';

import { CrudQueryOptionsInterface } from '../../crud/interfaces/crud-query-options.interface';
import { CrudEntityColumn } from '../../crud.types';
import { CrudFetchServiceInterface } from '../../services/interfaces/crud-fetch-service.interface';

export type QueryFields<T extends PlainLiteralObject> = CrudEntityColumn<T>[];

export type QueryFilter<T extends PlainLiteralObject> = {
  field: CrudEntityColumn<T>;
  operator: ComparisonOperator;
  value?: unknown;
  relation?: string;
};

export type QueryFilterArr<T extends PlainLiteralObject> = [
  CrudEntityColumn<T>,
  ComparisonOperator,
  unknown?,
];

export type QuerySort<T extends PlainLiteralObject> = {
  field: CrudEntityColumn<T>;
  order: QuerySortOperator;
  relation?: string;
};

export type QuerySortArr<T extends PlainLiteralObject> = [
  CrudEntityColumn<T>,
  QuerySortOperator,
];

export type QuerySortOperator = 'ASC' | 'DESC';

export enum CondOperator {
  EQUALS = '$eq',
  NOT_EQUALS = '$ne',
  GREATER_THAN = '$gt',
  LOWER_THAN = '$lt',
  GREATER_THAN_EQUALS = '$gte',
  LOWER_THAN_EQUALS = '$lte',
  STARTS = '$starts',
  ENDS = '$ends',
  CONTAINS = '$cont',
  EXCLUDES = '$excl',
  IN = '$in',
  NOT_IN = '$notin',
  IS_NULL = '$isnull',
  NOT_NULL = '$notnull',
  BETWEEN = '$between',
  EQUALS_LOW = '$eqL',
  NOT_EQUALS_LOW = '$neL',
  STARTS_LOW = '$startsL',
  ENDS_LOW = '$endsL',
  CONTAINS_LOW = '$contL',
  EXCLUDES_LOW = '$exclL',
  IN_LOW = '$inL',
  NOT_IN_LOW = '$notinL',
}

export type ComparisonOperator = keyof SFieldOperator;

// new search
export type SPrimitivesVal = string | number | boolean;

export type SFieldValues = SPrimitivesVal | Array<SPrimitivesVal>;

export type SFieldOperator = {
  $eq?: SFieldValues;
  $ne?: SFieldValues;
  $gt?: SFieldValues;
  $lt?: SFieldValues;
  $gte?: SFieldValues;
  $lte?: SFieldValues;
  $starts?: SFieldValues;
  $ends?: SFieldValues;
  $cont?: SFieldValues;
  $excl?: SFieldValues;
  $in?: SFieldValues;
  $notin?: SFieldValues;
  $between?: SFieldValues;
  $isnull?: SFieldValues;
  $notnull?: SFieldValues;
  $eqL?: SFieldValues;
  $neL?: SFieldValues;
  $startsL?: SFieldValues;
  $endsL?: SFieldValues;
  $contL?: SFieldValues;
  $exclL?: SFieldValues;
  $inL?: SFieldValues;
  $notinL?: SFieldValues;
  $or?: SFieldOperator;
  $and?: never;
};

export type SField = SPrimitivesVal | SFieldOperator;

export type SFields<T extends PlainLiteralObject> = Partial<
  Record<
    CrudEntityColumn<T>,
    SField | Array<SFields<T> | SConditionAND<T>> | undefined | null
  >
> & {
  $or?: Array<SCondition<T>>;
  $and?: never;
};

export type SConditionAND<T extends PlainLiteralObject> = {
  [key: string]: unknown;
  $and?: Array<SCondition<T>>;
  $or?: never;
};

export type SConditionKey = '$and' | '$or';

export type SCondition<T extends PlainLiteralObject> =
  | SFields<T>
  | SConditionAND<T>;

export type QueryRelationCardinality = 'one' | 'many';

export type QueryJoinType = 'LEFT' | 'INNER';

type QueryRelationBase<
  Entity extends PlainLiteralObject,
  Relation extends PlainLiteralObject = PlainLiteralObject,
> = {
  /**
   * The type of relation multiplicity from root to relation entity.
   * - 'one': Root has at most one related entity (1:1 or N:1)
   * - 'many': Root can have multiple related entities (1:N)
   */
  cardinality: QueryRelationCardinality;
  /**
   * The type of join to use when fetching this relation.
   * - 'LEFT': Include all roots, even without matching relations (default)
   * - 'INNER': Only include roots with matching relations
   */
  join?: QueryJoinType;
  /**
   * The target CRUD service responsible for hydration.
   */
  service: Type<CrudFetchServiceInterface<Relation>>;
  /**
   * The property name in the root (anchor) entity that holds the relation.
   */
  property: CrudEntityColumn<Entity> & string;
  /**
   * Filter to ensure uniqueness for many-cardinality relationships when sorting.
   * Required for relation sorting on 'many' relationships to guarantee at most
   * one relation row per root entity for consistent sort order.
   *
   * Example: `{ field: 'isLatest', operator: '$eq', value: true }`
   */
  distinctFilter?: QueryFilter<Relation>;
  /**
   *  Options for the relation.
   */
  options?: {
    query: Pick<CrudQueryOptionsInterface<Relation>, 'allow' | 'exclude'>;
  };
};

export type QueryRelation<
  Entity extends PlainLiteralObject,
  Relation extends PlainLiteralObject = PlainLiteralObject,
> = QueryRelationBase<Entity, Relation> & {
  /**
   * Whether the root entity owns the foreign key.
   * - false (default): Relation entity stores FK (relation[foreignKey] → root[primaryKey])
   * - true: Root entity stores FK (root[foreignKey] → relation[primaryKey])
   */
  owner?: boolean;
} & ( // Default ownership: relation[foreignKey] -> root[primaryKey]
    | {
        owner?: false | undefined;
        /**
         * The primary key field name in the root entity (target of the reference)
         */
        primaryKey: CrudEntityColumn<Entity> & string;
        /**
         * The foreign key field name in the relation entity (holds the reference)
         */
        foreignKey: CrudEntityColumn<Relation> & string;
      }
    // Root ownership: root[foreignKey] -> relation[primaryKey]
    | {
        owner: true;
        /**
         * The primary key field name in the relation entity (target of the reference)
         */
        primaryKey: CrudEntityColumn<Relation> & string;
        /**
         * The foreign key field name in the root entity (holds the reference)
         */
        foreignKey: CrudEntityColumn<Entity> & string;
      }
  );
