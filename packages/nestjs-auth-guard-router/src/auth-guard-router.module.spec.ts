import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuard } from '@concepta/nestjs-authentication';
import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

import { AuthGuardRouterModuleGuards } from './auth-guard-router.constants';
import { AuthGuardRouterModule } from './auth-guard-router.module';

import { AuthGuardRouterFixtureGuard } from './__fixtures__/auth-guard-router-fixture.guards';

jest.mock('@concepta/nestjs-authentication', () => ({
  AuthGuard: jest.fn().mockImplementation(() => jest.fn()),
}));
@Injectable()
export class AuthGoogleGuardTest
  extends AuthGuard('google', {
    canDisable: false,
  })
  implements AuthGuardInterface {}

describe(AuthGuardRouterModule, () => {
  let authGuardRouterModule: AuthGuardRouterModule;

  describe(AuthGuardRouterModule.forRoot, () => {
    it('module should be loaded with google guard', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          AuthGuardRouterModule.forRoot({
            guards: [
              {
                name: 'google',
                guard: AuthGuardRouterFixtureGuard,
              },
              {
                name: 'google-passport',
                guard: AuthGoogleGuardTest,
              },
            ],
          }),
        ],
      }).compile();

      authGuardRouterModule = module.get(AuthGuardRouterModule);
      expect(authGuardRouterModule).toBeInstanceOf(AuthGuardRouterModule);

      const guardsToken = module.get(AuthGuardRouterModuleGuards);
      expect(guardsToken.google).toBeInstanceOf(AuthGuardRouterFixtureGuard);
      expect(guardsToken['google-passport']).toBeInstanceOf(
        AuthGoogleGuardTest,
      );
    });
  });
});
