import supertest from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { useSeeders } from '@jorgebodega/typeorm-seeding';
import { RoleFactory } from './role.factory';
import { RoleSeeder } from './role.seeder';

import { AppModuleFixture } from './__fixtures__/app.module.fixture';
import { RoleEntityFixture } from './__fixtures__/entities/role-entity.fixture';

describe('RoleController (e2e)', () => {
  describe('Rest', () => {
    let app: INestApplication;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModuleFixture],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();

      RoleFactory.entity = RoleEntityFixture;

      await useSeeders(RoleSeeder, { root: __dirname, connection: 'default' });
    });

    afterEach(async () => {
      jest.clearAllMocks();
      return app ? await app.close() : undefined;
    });

    it('GET /role', async () => {
      const response = await supertest(app.getHttpServer())
        .get('/role?limit=10')
        .expect(200)
        .expect((res) => res.body.length === 10);
      expect(response);
    });

    it('GET /role/:id', async () => {
      // get an role so we have an id
      const response = await supertest(app.getHttpServer())
        .get('/role?limit=1')
        .expect(200);

      // get one using that id
      await supertest(app.getHttpServer())
        .get(`/role/${response.body[0].id}`)
        .expect(200);
    });

    it('POST /role', async () => {
      await supertest(app.getHttpServer())
        .post('/role')
        .send({
          name: 'company 1',
        })
        .expect(201);
    });

    it('DELETE /role/:id', async () => {
      // get an role so we have an id
      const response = await supertest(app.getHttpServer())
        .get('/role?limit=1')
        .expect(200);

      // delete one using that id
      await supertest(app.getHttpServer())
        .delete(`/role/${response.body[0].id}`)
        .expect(200);
    });
  });
});
