import { Injectable, PlainLiteralObject } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

import { CrudRequestInterface } from '../../crud/interfaces/crud-request.interface';
import { CrudServiceQueryOptionsInterface } from '../../crud/interfaces/crud-service-query-options.interface';
import { SCondition } from '../../request/types/crud-request-query.types';

@Injectable()
export class CrudQueryHelper<Entity extends PlainLiteralObject> {
  createRequest<
    T extends PlainLiteralObject = Entity,
  >(): CrudRequestInterface<T> {
    return {
      parsed: {
        search: undefined,
        sort: [],
        fields: [],
        limit: undefined,
        offset: undefined,
        page: undefined,
        paramsFilter: [],
        classTransformOptions: {},
        filter: [],
        or: [],
        cache: undefined,
        includeDeleted: undefined,
      },
      options: {},
    };
  }

  modifyRequest(
    req: CrudRequestInterface<Entity>,
    options?: CrudServiceQueryOptionsInterface<Entity>,
  ) {
    // get any options?
    if (options) {
      // deconstruct
      const { filter, ...rest } = options;
      // merge the options
      this.mergeOptions(req, rest);
      // add filters to search
      if (filter) {
        this.addSearch(req, filter);
      }
    }
  }

  mergeOptions(
    req: CrudRequestInterface<Entity>,
    options: Omit<CrudServiceQueryOptionsInterface<Entity>, 'filter'>,
  ) {
    // already have options on request?
    if (req.options) {
      // yes, merge them
      req.options.query = {
        ...req.options?.query,
        ...options,
      };
    } else {
      // no, set the property
      req.options = {
        query: options,
      };
    }
  }

  addSearch(
    req: CrudRequestInterface<Entity>,
    search?: SCondition<Entity> | SCondition<Entity>[],
  ) {
    if (search) {
      if (isUndefined(req.parsed.search)) {
        req.parsed.search = {};
      }
      return this.combineSearch(req.parsed.search, search);
    }
  }

  combineSearch(
    rootSearch: SCondition<Entity>,
    search: SCondition<Entity> | SCondition<Entity>[],
  ) {
    // handle array recursively
    if (Array.isArray(search)) {
      for (const searchItem of search) {
        this.combineSearch(rootSearch, searchItem);
      }
      return;
    }

    // skip empty searches
    if (!search || Object.keys(search).length === 0) {
      return;
    }

    if (Array.isArray(rootSearch?.$and)) {
      if (Array.isArray(search?.$and)) {
        rootSearch.$and.push(...search.$and);
      } else {
        rootSearch.$and.push(search);
      }
    } else {
      const hasExistingConditions = Object.keys(rootSearch).length > 0;

      if (hasExistingConditions) {
        const { ...fields } = rootSearch;
        for (const key of Object.keys(rootSearch)) {
          delete rootSearch[key];
        }
        rootSearch.$and = [fields, search];
      } else {
        // Directly assign search properties when rootSearch is empty
        Object.assign(rootSearch, search);
      }
    }
  }
}
