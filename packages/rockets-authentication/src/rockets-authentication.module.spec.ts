import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalModuleFixture } from './__fixtures__/global.module.fixture';
import {
  JwtModule,
  JwtService,
  JwtIssueTokenService,
  JwtVerifyTokenService,
} from '@concepta/nestjs-jwt';

import {
  IssueTokenService,
  VerifyTokenService,
} from '@concepta/nestjs-authentication';
import { AuthJwtGuard, AuthJwtStrategy } from '@concepta/nestjs-auth-jwt';
import { AuthRefreshStrategy } from '@concepta/nestjs-auth-refresh/dist/auth-refresh.strategy';
import { AuthRefreshGuard } from '@concepta/nestjs-auth-refresh';
import { RocketsAuthenticationModule } from './rockets-authentication.module';
import { VerifyTokenServiceFixture } from './__fixtures__/services/verify-token.service.fixture';
import { IssueTokenServiceFixture } from './__fixtures__/services/issue-token.service.fixture';
import { ValidateTokenServiceFixture } from './__fixtures__/services/validate-token.service.fixture';
import { RocketsAuthenticationOptionsInterface } from './interfaces/rockets-authentication-options.interface';

// Mock user lookup service
const mockUserLookupService = {
  findOne: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
  bySubject: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
};

// Mock configuration module
@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'jwt.secret') return 'test-secret';
          if (key === 'jwt.expiresIn') return '1h';
          return null;
        }),
      },
    },
  ],
  exports: [ConfigService],
})
class MockConfigModule {}

// Test module factory function matching the pattern used in other authentication specs
function testModuleFactory(
  extraImports: DynamicModule['imports'] = [],
): ModuleMetadata {
  return {
    imports: [
      GlobalModuleFixture,
      MockConfigModule,
      JwtModule.forRoot({}),
      ...extraImports,
    ],
  };
}

describe('AuthenticationCombinedImportModule Integration', () => {
  // Helper function to load and assign variables
  function commonVars(testModule: TestingModule) {
    // JWT services
    const jwtService = testModule.get(JwtService);
    const verifyTokenService = testModule.get(VerifyTokenService);
    const issueTokenService = testModule.get(IssueTokenService);
    const jwtIssueTokenService = testModule.get(JwtIssueTokenService);
    const jwtVerifyTokenService = testModule.get(JwtVerifyTokenService);

    // Auth JWT services
    const authJwtStrategy = testModule.get(AuthJwtStrategy);
    const authJwtGuard = testModule.get(AuthJwtGuard);

    // Auth Refresh services
    const authRefreshStrategy = testModule.get(AuthRefreshStrategy);
    const authRefreshGuard = testModule.get(AuthRefreshGuard);

    return {
      jwtService,
      verifyTokenService,
      issueTokenService,
      jwtIssueTokenService,
      jwtVerifyTokenService,
      authJwtStrategy,
      authJwtGuard,
      authRefreshStrategy,
      authRefreshGuard,
    };
  }

  // Common assertions to verify the services are defined
  function commonTests(services: ReturnType<typeof commonVars>) {
    // Verify JWT services are defined
    expect(services.jwtService).toBeDefined();
    expect(services.verifyTokenService).toBeDefined();
    expect(services.issueTokenService).toBeDefined();
    expect(services.jwtIssueTokenService).toBeDefined();
    expect(services.jwtVerifyTokenService).toBeDefined();

    // Verify Auth JWT services
    expect(services.authJwtStrategy).toBeDefined();
    expect(services.authJwtGuard).toBeDefined();

    // Verify Auth Refresh services
    expect(services.authRefreshStrategy).toBeDefined();
    expect(services.authRefreshGuard).toBeDefined();
  }

  describe('forRootAsync with import strategy', () => {
    let testModule: TestingModule;

    it('should define all required services and modules', async () => {
      // Create test module with forRootAsync registration
      testModule = await Test.createTestingModule(
        testModuleFactory([
          RocketsAuthenticationModule.forRootAsync({
            imports: [MockConfigModule],
            inject: [
              ConfigService,
              VerifyTokenServiceFixture,
              IssueTokenServiceFixture,
              ValidateTokenServiceFixture,
            ],
            useFactory: (
              configService: ConfigService,
              verifyTokenService: VerifyTokenServiceFixture,
              issueTokenService: IssueTokenServiceFixture,
              validateTokenService: ValidateTokenServiceFixture,
            ): RocketsAuthenticationOptionsInterface => ({
              jwt: {
                settings: {
                  access: { secret: configService.get('jwt.secret') },
                  default: { secret: configService.get('jwt.secret') },
                  refresh: { secret: configService.get('jwt.secret') },
                },
              },
              services: {
                userLookupService: mockUserLookupService,
                verifyTokenService,
                issueTokenService,
                validateTokenService,
              },
            }),
          }),
        ]),
      ).compile();

      // Get services and run common tests
      const services = commonVars(testModule);
      commonTests(services);

      // Additional tests specific to async registration
      expect(testModule.get(ConfigService)).toBeDefined();

      // Verify that the verifyTokenService is an instance of VerifyTokenService
      const vts = testModule.get(VerifyTokenService);
      expect(vts).toBeInstanceOf(VerifyTokenService);
    });
  });

  describe('forRoot (sync) with direct options', () => {
    let testModule: TestingModule;

    it('should define all required services and modules', async () => {
      // Create test module with forRoot registration
      testModule = await Test.createTestingModule(
        testModuleFactory([
          RocketsAuthenticationModule.forRoot({
            jwt: {
              settings: {
                access: { secret: 'test-secret-forroot' },
                default: { secret: 'test-secret-forroot' },
                refresh: { secret: 'test-secret-forroot' },
              },
            },
            services: {
              userLookupService: mockUserLookupService,
              verifyTokenService: new VerifyTokenServiceFixture(),
              issueTokenService: new IssueTokenServiceFixture(),
              validateTokenService: new ValidateTokenServiceFixture(),
            },
          }),
        ]),
      ).compile();

      // Get services and run common tests
      const services = commonVars(testModule);
      commonTests(services, testModule);
    });
  });
});
