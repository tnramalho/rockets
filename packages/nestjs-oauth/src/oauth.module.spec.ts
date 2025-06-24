import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuard } from '@concepta/nestjs-authentication';
import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

import { OAuthModule } from './oauth.module';

import { OAuthFixtureGuard } from './__fixtures__/oauth-fixture.guards';

jest.mock('@concepta/nestjs-authentication', () => ({
  AuthGuard: jest.fn().mockImplementation(() => jest.fn()),
}));
@Injectable()
export class AuthGoogleGuardTest
  extends AuthGuard('google', {
    canDisable: false,
  })
  implements AuthGuardInterface {}

describe(OAuthModule, () => {
  let oauthModule: OAuthModule;

  describe(OAuthModule.forRoot, () => {
    it('module should be loaded with google guard', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          OAuthModule.forRoot({
            oAuthGuards: [
              {
                name: 'google',
                guard: OAuthFixtureGuard,
              },
              {
                name: 'google-passport',
                guard: AuthGoogleGuardTest,
              },
            ],
          }),
        ],
      }).compile();

      oauthModule = module.get(OAuthModule);
      expect(oauthModule).toBeInstanceOf(OAuthModule);

      const guardsToken = module.get('OAUTH_MODULE_GUARDS_TOKEN');
      expect(guardsToken.google).toBeInstanceOf(OAuthFixtureGuard);
      expect(guardsToken['google-passport']).toBeInstanceOf(
        AuthGoogleGuardTest,
      );
    });
  });
});
