import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGoogleGuard } from '@concepta/nestjs-auth-google';
import { AuthGuard } from '@concepta/nestjs-authentication';

import { AuthRouterModuleGuards } from './auth-router.constants';
import { AuthRouterModule } from './auth-router.module';

import { AuthRouterFixtureGuard } from './__fixtures__/auth-router-fixture.guards';

@Injectable()
export class AuthGoogleGuardTest extends AuthGuard('google', {
  canDisable: false,
}) {}

describe(AuthRouterModule, () => {
  let authRouterModule: AuthRouterModule;

  describe(AuthRouterModule.forRoot, () => {
    it('module should be loaded with google guard', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          AuthRouterModule.forRoot({
            guards: [
              {
                name: 'auth-google',
                guard: AuthGoogleGuard,
              },
              {
                name: 'google',
                guard: AuthRouterFixtureGuard,
              },
              {
                name: 'google-passport',
                guard: AuthGoogleGuardTest,
              },
            ],
          }),
        ],
      }).compile();

      authRouterModule = module.get(AuthRouterModule);
      expect(authRouterModule).toBeInstanceOf(AuthRouterModule);

      const guardsToken = module.get(AuthRouterModuleGuards);
      expect(guardsToken.google).toBeInstanceOf(AuthRouterFixtureGuard);
      expect(guardsToken['google-passport']).toBeInstanceOf(
        AuthGoogleGuardTest,
      );
    });
  });
});
