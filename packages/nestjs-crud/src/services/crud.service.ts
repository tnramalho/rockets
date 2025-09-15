import { Injectable, PlainLiteralObject } from '@nestjs/common';

import { CrudAdapter } from '../crud/adapters/crud.adapter';
import { CrudRequestInterface } from '../crud/interfaces/crud-request.interface';
import { CrudResponsePaginatedInterface } from '../crud/interfaces/crud-response-paginated.interface';
import { CrudServiceQueryOptionsInterface } from '../crud/interfaces/crud-service-query-options.interface';
import { CrudQueryException } from '../exceptions/crud-query.exception';

import { CrudFederationService } from './crud-federation.service';
import { CrudRelationRegistry } from './crud-relation.registry';
import { CrudQueryHelper } from './helpers/crud-query.helper';
import { CrudSearchHelper } from './helpers/crud-search.helper';
import { CrudFetchServiceInterface } from './interfaces/crud-fetch-service.interface';

@Injectable()
export class CrudService<
  Entity extends PlainLiteralObject,
  Relations extends PlainLiteralObject[] = PlainLiteralObject[],
> implements CrudFetchServiceInterface<Entity>
{
  protected readonly federationService: CrudFederationService<
    Entity,
    Relations
  >;

  constructor(
    protected crudAdapter: CrudAdapter<Entity>,
    protected relationRegistry?: CrudRelationRegistry<Entity, Relations>,
  ) {
    // Create federation service with dependencies
    this.federationService = new CrudFederationService<Entity, Relations>(
      this.crudAdapter,
      this.relationRegistry,
    );
  }

  protected readonly crudQueryHelper: CrudQueryHelper<Entity> =
    new CrudQueryHelper();

  protected readonly crudSearchHelper: CrudSearchHelper<Entity> =
    new CrudSearchHelper();

  async getMany(
    req: CrudRequestInterface<Entity>,
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): Promise<CrudResponsePaginatedInterface<Entity>> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);

    // get root result
    try {
      // Use federated service if relations are configured
      if (this.hasRelations(req)) {
        return await this.federationService.getMany(req);
      } else {
        // build search conditions
        this.crudSearchHelper.buildSearch(req);
        return await this.crudAdapter.getMany(req);
      }
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async getOne(
    req: CrudRequestInterface<Entity>,
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['getOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);

    // return root result
    try {
      // check if relations are requested
      if (this.hasRelations(req)) {
        return this.federationService.getOne(req);
      } else {
        // build search conditions
        this.crudSearchHelper.buildSearch(req);
        return this.crudAdapter.getOne(req);
      }
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async createMany(
    req: CrudRequestInterface<Entity>,
    dto: Parameters<CrudAdapter<Entity>['createMany']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['createMany']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.createMany(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async createOne(
    req: CrudRequestInterface<Entity>,
    dto: Parameters<CrudAdapter<Entity>['createOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['createOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.createOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async updateOne(
    req: CrudRequestInterface<Entity>,
    dto: Parameters<CrudAdapter<Entity>['updateOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['updateOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.updateOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async replaceOne(
    req: CrudRequestInterface<Entity>,
    dto: Parameters<CrudAdapter<Entity>['replaceOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['replaceOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.replaceOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async deleteOne(
    req: CrudRequestInterface<Entity>,
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['deleteOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.deleteOne(req);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  async recoverOne(
    req: CrudRequestInterface<Entity>,
    queryOptions?: CrudServiceQueryOptionsInterface<Entity>,
  ): ReturnType<CrudAdapter<Entity>['recoverOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // build search conditions
    this.crudSearchHelper.buildSearch(req);
    // return root result
    try {
      return this.crudAdapter.recoverOne(req);
    } catch (e) {
      throw new CrudQueryException(this.crudAdapter.entityName(), {
        originalError: e,
      });
    }
  }

  protected hasRelations(req: CrudRequestInterface<Entity>): boolean {
    // check if relations are configured and present
    const relations = req.options?.query?.relations?.relations ?? [];
    return relations.length > 0;
  }
}
