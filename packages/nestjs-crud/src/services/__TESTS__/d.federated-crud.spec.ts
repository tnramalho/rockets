import request from 'supertest';
import { DataSource } from 'typeorm';

import { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';

import { ExceptionsFilter } from '@concepta/nestjs-common';

import { CompanyCrudService } from '../../__fixtures__/typeorm/company/company-crud.service';
import { CompanyTypeOrmCrudAdapter } from '../../__fixtures__/typeorm/company/company-typeorm-crud.adapter';
import { CompanyEntity } from '../../__fixtures__/typeorm/company/company.entity';
import { CompanyPaginatedDto } from '../../__fixtures__/typeorm/company/dto/company-paginated.dto';
import { CompanyDto } from '../../__fixtures__/typeorm/company/dto/company.dto';
import { ormSqliteConfig } from '../../__fixtures__/typeorm/orm.sqlite.config';
import { Seeds } from '../../__fixtures__/typeorm/seeds';
import { UserProfileCrudService } from '../../__fixtures__/typeorm/user-profile/user-profile-crud.service';
import { UserProfileTypeOrmCrudAdapter } from '../../__fixtures__/typeorm/user-profile/user-profile-typeorm-crud.adapter';
import { UserProfileEntity } from '../../__fixtures__/typeorm/user-profile/user-profile.entity';
import { UserPaginatedDto } from '../../__fixtures__/typeorm/users/dto/user-paginated.dto';
import { UserDto } from '../../__fixtures__/typeorm/users/dto/user.dto';
import { UserCrudService } from '../../__fixtures__/typeorm/users/user-crud.service';
import { UserTypeOrmCrudAdapter } from '../../__fixtures__/typeorm/users/user-typeorm-crud.adapter';
import { UserEntity } from '../../__fixtures__/typeorm/users/user.entity';
import { CrudGetMany } from '../../crud/decorators/actions/crud-get-many.decorator';
import { CrudGetOne } from '../../crud/decorators/actions/crud-get-one.decorator';
import { CrudController } from '../../crud/decorators/controller/crud-controller.decorator';
import { CrudRequest } from '../../crud/decorators/params/crud-request.decorator';
import { CrudLimit } from '../../crud/decorators/routes/crud-limit.decorator';
import { CrudRelations } from '../../crud/decorators/routes/crud-relations.decorator';
import { CrudSort } from '../../crud/decorators/routes/crud-sort.decorator';
import { CrudRequestInterface } from '../../crud/interfaces/crud-request.interface';
import { CrudModule } from '../../crud.module';
import { CrudRelationRegistry } from '../crud-relation.registry';

// tslint:disable:max-classes-per-file no-shadowed-variable
describe.skip('#crud-typeorm', () => {
  describe('#basic crud respects global limit', () => {
    let app: INestApplication;
    let server: ReturnType<INestApplication['getHttpServer']>;

    @CrudController({
      path: 'companies0',
      model: {
        type: CompanyDto,
        paginatedType: CompanyPaginatedDto,
      },
    })
    @CrudLimit(3)
    @CrudSort([{ field: 'id', order: 'ASC' }])
    @CrudRelations<CompanyEntity, [UserEntity]>({
      rootKey: 'id',
      relations: [
        {
          join: 'INNER',
          cardinality: 'many',
          service: UserCrudService,
          property: 'users',
          primaryKey: 'id',
          foreignKey: 'companyId',
        },
      ],
    })
    class CompaniesController0 {
      constructor(public service: CompanyCrudService) {}

      @CrudGetMany()
      getMany(@CrudRequest() request: CrudRequestInterface<CompanyEntity>) {
        return this.service.getMany(request);
      }
    }

    @CrudController({
      path: 'users',
      model: {
        type: UserDto,
        paginatedType: UserPaginatedDto,
      },
    })
    @CrudSort([{ field: 'id', order: 'ASC' }])
    @CrudRelations<UserEntity, [UserProfileEntity /* CompanyEntity */]>({
      rootKey: 'id',
      relations: [
        {
          cardinality: 'one',
          service: UserProfileCrudService,
          property: 'userProfile',
          primaryKey: 'id',
          foreignKey: 'userId',
        },
        // {
        //   owner: true,
        //   cardinality: 'many',
        //   service: CompanyCrudService,
        //   property: 'company',
        //   primaryKey: 'id',
        //   foreignKey: 'companyId',
        // },
      ],
    })
    class UsersController {
      constructor(public service: UserCrudService) {}

      @CrudGetMany()
      getMany(@CrudRequest() request: CrudRequestInterface<UserEntity>) {
        return this.service.getMany(request);
      }

      @CrudGetOne()
      getOne(@CrudRequest() request: CrudRequestInterface<UserEntity>) {
        return this.service.getOne(request);
      }
    }

    beforeAll(async () => {
      const fixture = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot(ormSqliteConfig),
          TypeOrmModule.forFeature([
            CompanyEntity,
            UserEntity,
            UserProfileEntity,
          ]),
          CrudModule.forRoot({}),
        ],
        controllers: [CompaniesController0, UsersController],
        providers: [
          { provide: APP_FILTER, useClass: ExceptionsFilter },
          CompanyTypeOrmCrudAdapter,
          CompanyCrudService,
          UserTypeOrmCrudAdapter,
          UserCrudService,
          UserProfileTypeOrmCrudAdapter,
          UserProfileCrudService,
          {
            provide: 'COMPANY_RELATION_REGISTRY',
            inject: [UserCrudService],
            useFactory(userCrudService) {
              const registry = new CrudRelationRegistry<
                CompanyEntity,
                [UserEntity]
              >();
              registry.register(userCrudService);
              return registry;
            },
          },
          {
            provide: 'USER_RELATION_REGISTRY',
            inject: [UserProfileCrudService, CompanyCrudService],
            useFactory(userProfileCrudService, companyCrudService) {
              const registry = new CrudRelationRegistry<
                UserEntity,
                [UserProfileEntity, CompanyEntity]
              >();
              registry.register(userProfileCrudService);
              registry.register(companyCrudService);
              return registry;
            },
          },
        ],
      }).compile();

      app = fixture.createNestApplication();

      await app.init();
      server = app.getHttpServer();

      const datasource = app.get<DataSource>(getDataSourceToken());
      const seeds = new Seeds();
      await seeds.up(datasource.createQueryRunner());
    });

    afterAll(async () => {
      await app.close();
    });

    describe('#getAll', () => {
      it('should return an array of all company entities', (done) => {
        request(server)
          .get(
            '/companies0?filter=name||$startsL||Name&filter=users.isActive||$eq||true',
          )
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(3);
            expect(res.body.page).toBe(1);
            done();
          });
      });
      it.only('should return an array of all user entities', (done) => {
        request(server)
          .get(
            // '/users?sort[]=userProfile.nickName,DESC&page=2&limit=10',
            '/users?filter[]=userProfile.favoriteColor||$eq||Orange&page=1&limit=10',
          )
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body.data).toBe({});
            done();
          });
      });
      it('should return one user entity', (done) => {
        request(server)
          .get('/users/1')
          .end((_, res) => {
            expect(res.status).toBe(200);
            expect(res.body).toBe({});
            done();
          });
      });
    });
  });
});
