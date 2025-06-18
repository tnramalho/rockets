import { Test, TestingModule } from '@nestjs/testing';

import { OAuthModule } from './oauth.module';

import { OAuthFixtureGuard } from './__fixtures__/oauth-fixture.guards';

describe(OAuthModule, () => {
  let oAuthModule: OAuthModule;

  describe(OAuthModule.forRoot, () => {
    it('module should be loaded', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          OAuthModule.forRoot({
            oAuthGuards: [
              {
                name: 'testGuard',
                guard: OAuthFixtureGuard,
              },
            ],
          }),
        ],
      }).compile();

      oAuthModule = module.get(OAuthModule);

      expect(oAuthModule).toBeInstanceOf(OAuthModule);
    });
  });
});
