import { PlainLiteralObject } from '@nestjs/common';

import { COMPARISON_OPERATORS } from './crud-request-query.contants';
import {
  ComparisonOperator,
  QueryFilter,
  SConditionAND,
  SFields,
} from './types/crud-request-query.types';

export function isComparisonOperator(
  operator: string,
): operator is ComparisonOperator {
  const found = COMPARISON_OPERATORS.find(
    (validOperator) => operator === validOperator,
  );
  return found !== undefined;
}

export function comparisonOperatorKeys(
  obj: Record<string, unknown>,
): ComparisonOperator[] {
  return Object.keys(obj).filter((key: string): key is ComparisonOperator =>
    isComparisonOperator(key),
  );
}

export function splitSortString(sort: string, delim = ',') {
  const [field, order] = sort.split(delim);
  let sortField: string;
  let relation: string | undefined;

  if (field.includes('.')) {
    const parts = field.split('.');
    [relation, sortField] = parts;
  } else {
    sortField = field;
  }

  return {
    field: sortField ? sortField.trim() : undefined,
    order: order ? order.trim().toUpperCase() : undefined,
    relation,
  };
}

export function convertFilterToSearch<Entity extends PlainLiteralObject>(
  filter: QueryFilter<Entity>,
): SFields<Entity> | SConditionAND<Entity> {
  return filter
    ? {
        [filter.field]: {
          [filter.operator]:
            filter.operator === '$isnull' || filter.operator === '$notnull'
              ? true
              : filter.value,
        },
      }
    : {};
}
