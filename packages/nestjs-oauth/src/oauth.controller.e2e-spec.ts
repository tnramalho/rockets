import supertest from 'supertest';

import {
  INestApplication,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OAUTH_MODULE_GUARDS_TOKEN } from './oauth.constants';
import { OAuthModule } from './oauth.module';

import { OAuthFixtureGuard } from './__fixtures__/oauth-fixture.guards';
import { OAuthControllerFixture } from './__fixtures__/oauth.controller.fixture';

describe('OAuthController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let guardsRecord: { google: CanActivate };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        OAuthModule.forRoot({
          oAuthGuards: [
            {
              name: 'google',
              guard: OAuthFixtureGuard,
            },
          ],
        }),
      ],
      controllers: [OAuthControllerFixture],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get the guards record from the module
    guardsRecord = moduleFixture.get(OAUTH_MODULE_GUARDS_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  describe(OAuthControllerFixture.prototype.login, () => {
    it('should call the OAuth guard and return successfully when provider is specified', async () => {
      const googleGuard = guardsRecord.google;
      const guardSpy = jest.spyOn(googleGuard, 'canActivate');

      await supertest(app.getHttpServer())
        .get('/oauth/login?provider=google')
        .expect(200);

      // Verify the guard was called
      expect(guardSpy).toHaveBeenCalled();

      // Verify the guard received the correct execution context
      const executionContext = guardSpy.mock.calls[0][0] as ExecutionContext;
      const httpRequest = executionContext.switchToHttp().getRequest();
      expect(httpRequest.query.provider).toBe('google');
    });

    it('should return 500 when provider is missing (OAuth exception)', async () => {
      await supertest(app.getHttpServer()).get('/oauth/login').expect(500);
    });

    it('should return 500 when provider is not supported (OAuth exception)', async () => {
      await supertest(app.getHttpServer())
        .get('/oauth/login?provider=unsupported')
        .expect(500);
    });
  });

  describe(OAuthControllerFixture.prototype.callback, () => {
    it('should call the OAuth guard and return success response when provider is specified', async () => {
      const googleGuard = guardsRecord.google;
      const guardSpy = jest.spyOn(googleGuard, 'canActivate');

      const response = await supertest(app.getHttpServer())
        .get('/oauth/callback?provider=google')
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
