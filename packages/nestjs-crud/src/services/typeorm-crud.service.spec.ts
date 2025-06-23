import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { CrudCreateManyInterface } from '../crud/interfaces/crud-create-many.interface';
import { CrudRequestInterface } from '../crud/interfaces/crud-request.interface';
import { CrudServiceQueryOptionsInterface } from '../crud/interfaces/crud-service-query-options.interface';

import { CrudQueryHelper } from './helpers/crud-query.helper';
import { TypeOrmCrudService } from './typeorm-crud.service';
import { xTypeOrmCrudService } from './x-typeorm-crud.service';

jest.mock('./x-typeorm-crud.service');

describe('TypeOrmService', () => {
  // fake entity/repo
  class Thing {}
  class ThingRepository extends Repository<Thing> {}

  // test orm service
  class TestOrmService extends TypeOrmCrudService<Thing> {}

  let ormService: TestOrmService;
  let mockRequest: CrudRequestInterface;
  let mockOverrides: CrudServiceQueryOptionsInterface;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TestOrmService,
        CrudQueryHelper,
        { provide: Repository, useValue: mock(ThingRepository) },
      ],
    }).compile();

    ormService = moduleRef.get<TestOrmService>(TestOrmService);

    mockRequest = {
      options: { query: { alwaysPaginate: true } },
      parsed: { search: { name: 'apple' } },
    } as unknown as CrudRequestInterface;

    mockOverrides = {
      filter: { name: 'pear' },
      alwaysPaginate: false,
    };
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('simple crud methods', () => {
    type SingleArg = keyof Pick<
      TestOrmService,
      'getMany' | 'getOne' | 'deleteOne'
    >;

    const crudMethods: SingleArg[] = ['getMany', 'getOne', 'deleteOne'];

    it.each(crudMethods)(
      '%s should use custom options',
      async (crudMethod: SingleArg) => {
        const spy = jest.spyOn(xTypeOrmCrudService.prototype, crudMethod);

        await ormService[crudMethod](mockRequest, mockOverrides);

        expect(spy).toBeCalledTimes(1);

        expect(spy).toBeCalledWith({
          options: { query: { alwaysPaginate: false } },
          parsed: {
            search: { $and: [{ name: 'apple' }, { name: 'pear' }] },
          },
        });
      },
    );
  });

  describe('complex crud methods (have dto argument)', () => {
    type DoubleArg = keyof Pick<
      TestOrmService,
      'createMany' | 'createOne' | 'updateOne' | 'replaceOne'
    >;

    const crudMethods: DoubleArg[] = [
      'createMany',
      'createOne',
      'updateOne',
      'replaceOne',
    ];

    it.each(crudMethods)(
      '%s should use custom options',
      async (crudMethod: DoubleArg) => {
        const spy = jest.spyOn(xTypeOrmCrudService.prototype, crudMethod);

        let dto: Type<Thing> | CrudCreateManyInterface<Type<Thing>>;

        if (crudMethod === 'createMany') {
          dto = { bulk: [class extends Thing {}] };
          await ormService[crudMethod](mockRequest, dto, mockOverrides);
        } else {
          dto = class extends Thing {};
          await ormService[crudMethod](mockRequest, dto, mockOverrides);
        }

        expect(spy).toBeCalledTimes(1);

        expect(spy).toBeCalledWith(
          {
            options: { query: { alwaysPaginate: false } },
            parsed: {
              search: { $and: [{ name: 'apple' }, { name: 'pear' }] },
            },
          },
          dto,
        );
      },
    );
  });
});
