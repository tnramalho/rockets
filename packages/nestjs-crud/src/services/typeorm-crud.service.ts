import { ObjectLiteral, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';

import { CrudRequestInterface } from '../crud/interfaces/crud-request.interface';
import { CrudResponsePaginatedInterface } from '../crud/interfaces/crud-response-paginated.interface';
import { CrudServiceQueryOptionsInterface } from '../crud/interfaces/crud-service-query-options.interface';
import { CrudQueryException } from '../exceptions/crud-query.exception';

import { CrudQueryHelper } from './helpers/crud-query.helper';
import { xTypeOrmCrudService } from './x-typeorm-crud.service';

// TODO: TYPEORM - review what to do
@Injectable()
export class TypeOrmCrudService<
  T extends ObjectLiteral,
> extends xTypeOrmCrudService<T> {
  constructor(protected repo: Repository<T>) {
    super(repo);
  }

  protected readonly crudQueryHelper: CrudQueryHelper = new CrudQueryHelper();

  async getMany(
    req: CrudRequestInterface,
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): Promise<T[] | CrudResponsePaginatedInterface<T>> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);

    // the result
    let result;

    // get parent result
    try {
      result = await super.getMany(req);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }

    // is an array?
    if (Array.isArray(result)) {
      // yes, just return
      return result;
    } else {
      // not an array, return as is
      return result;
    }
  }

  async getOne(
    req: CrudRequestInterface,
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['getOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.getOne(req);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async createMany(
    req: CrudRequestInterface,
    dto: Parameters<xTypeOrmCrudService<T>['createMany']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['createMany']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.createMany(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async createOne(
    req: CrudRequestInterface,
    dto: Parameters<xTypeOrmCrudService<T>['createOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['createOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.createOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async updateOne(
    req: CrudRequestInterface,
    dto: Parameters<xTypeOrmCrudService<T>['updateOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['updateOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.updateOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async replaceOne(
    req: CrudRequestInterface,
    dto: Parameters<xTypeOrmCrudService<T>['replaceOne']>[1],
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['replaceOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.replaceOne(req, dto);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async deleteOne(
    req: CrudRequestInterface,
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['deleteOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.deleteOne(req);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }

  async recoverOne(
    req: CrudRequestInterface,
    queryOptions?: CrudServiceQueryOptionsInterface,
  ): ReturnType<xTypeOrmCrudService<T>['recoverOne']> {
    // apply options
    this.crudQueryHelper.modifyRequest(req, queryOptions);
    // return parent result
    try {
      return super.recoverOne(req);
    } catch (e) {
      throw new CrudQueryException(this.repo.metadata.name, {
        originalError: e,
      });
    }
  }
}
