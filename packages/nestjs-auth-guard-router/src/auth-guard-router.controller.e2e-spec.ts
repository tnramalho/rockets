import supertest from 'supertest';

import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CanActivate } from '@nestjs/common';

import { AuthGuardRouterModuleGuards } from './auth-guard-router.constants';
import { AuthGuardRouterModule } from './auth-guard-router.module';

import { AuthGuardRouterFixtureGuard } from './__fixtures__/auth-guard-router-fixture.guards';
import { AuthGuardRouterControllerFixture } from './__fixtures__/auth-guard-router.controller.fixture';

describe('AuthGuardRouterController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let guardsRecord: { google: CanActivate };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        AuthGuardRouterModule.forRoot({
          guards: [
            {
              name: 'google',
              guard: AuthGuardRouterFixtureGuard,
            },
          ],
        }),
      ],
      controllers: [AuthGuardRouterControllerFixture],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the guards record from the module
    guardsRecord = moduleFixture.get(AuthGuardRouterModuleGuards);
  });

  afterAll(async () => {
    await app.close();
  });

  describe(AuthGuardRouterControllerFixture.prototype.login, () => {
    it('should call the Auth Guard Router guard and return successfully when provider is specified', async () => {
      const googleGuard = guardsRecord.google;
      const guardSpy = jest.spyOn(googleGuard, 'canActivate');

      await supertest(app.getHttpServer())
        .get('/auth-guard-router/login?provider=google')
        .expect(200);

      // Verify the guard was called
      expect(guardSpy).toHaveBeenCalled();

      // Verify the guard received the correct execution context
      const executionContext = guardSpy.mock.calls[0][0] as ExecutionContext;
      const httpRequest = executionContext.switchToHttp().getRequest();
      expect(httpRequest.query.provider).toBe('google');
    });

    it('should return 500 when provider is missing (Auth Guard Router exception)', async () => {
      await supertest(app.getHttpServer())
        .get('/auth-guard-router/login')
        .expect(500);
    });

    it('should return 500 when provider is not supported (Auth Guard Router exception)', async () => {
      await supertest(app.getHttpServer())
        .get('/auth-guard-router/login?provider=unsupported')
        .expect(500);
    });
  });

  describe(AuthGuardRouterControllerFixture.prototype.callback, () => {
    it('should call the Auth Guard Router guard and return success response when provider is specified', async () => {
      const googleGuard = guardsRecord.google;
      const guardSpy = jest.spyOn(googleGuard, 'canActivate');

      const response = await supertest(app.getHttpServer())
        .get('/auth-guard-router/callback?provider=google')
        .expect(200);

      // Verify the guard was called
      expect(guardSpy).toHaveBeenCalled();

      // Verify the response contains the expected data
      expect(response.body).toEqual({ ok: 'success' });

      // Verify the guard received the correct execution context
      const executionContext = guardSpy.mock.calls[0][0] as ExecutionContext;
      const httpRequest = executionContext.switchToHttp().getRequest();
      expect(httpRequest.query.provider).toBe('google');

      // Verify the user was attached by the guard
      expect(httpRequest.user).toBeDefined();
      expect(httpRequest.user.id).toBe('fixture-user-allow');
      expect(httpRequest.user.provider).toBe('google');
    });
  });
});
