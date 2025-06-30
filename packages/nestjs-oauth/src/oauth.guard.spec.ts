import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuardInterface } from '@concepta/nestjs-authentication';

import {
  OAuthAuthenticationFailedException,
  OAuthConfigNotAvailableException,
  OAuthGuardInvalidException,
  OAuthProviderMissingException,
  OAuthProviderNotSupportedException,
} from './exceptions';
import { OAuthModuleGuards } from './oauth.constants';
import { OAuthGuard } from './oauth.guard';

// Mock guard classes for testing
class MockSuccessGuard implements AuthGuardInterface, CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

class MockFailureGuard implements AuthGuardInterface, CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return false;
  }
}

class MockAsyncSuccessGuard implements AuthGuardInterface, CanActivate {
  canActivate(_context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockErrorGuard implements AuthGuardInterface, CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    throw new Error('Mock guard error');
  }
}

class MockAsyncErrorGuard implements AuthGuardInterface, CanActivate {
  canActivate(_context: ExecutionContext): Promise<boolean> {
    return Promise.reject(new Error('Mock async guard error'));
  }
}

describe(OAuthGuard.name, () => {
  let guard: OAuthGuard;
  let mockExecutionContext: ExecutionContext;
  let mockOAuthGuards: Record<string, AuthGuardInterface>;

  const createMockExecutionContext = (provider?: string): ExecutionContext => {
    const mockRequest = {
      query: { provider },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => () => {},
      }),
      getClass: () => class {},
      getHandler: () => () => {},
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({
        getContext: () => ({}),
        getData: () => ({}),
      }),
      switchToWs: () => ({
        getClient: () => ({}),
        getData: () => ({}),
        getPattern: () => undefined,
      }),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockOAuthGuards = {
      google: new MockSuccessGuard(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthGuard,
        {
          provide: OAuthModuleGuards,
          useValue: mockOAuthGuards,
        },
      ],
    }).compile();

    guard = module.get<OAuthGuard>(OAuthGuard);
  });

  describe('Guard Instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should be an instance of OAuthGuard', () => {
      expect(guard).toBeInstanceOf(OAuthGuard);
    });
  });

  describe('canActivate - Provider Validation', () => {
    it('should throw OAuthProviderMissingException when provider is missing', async () => {
      mockExecutionContext = createMockExecutionContext();

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });

    it('should throw OAuthProviderMissingException when provider is empty string', async () => {
      mockExecutionContext = createMockExecutionContext('');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });

    it('should throw OAuthProviderMissingException when provider is null', async () => {
      mockExecutionContext = createMockExecutionContext(
        null as unknown as string,
      );

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });

    it('should throw OAuthProviderMissingException when provider is undefined', async () => {
      mockExecutionContext = createMockExecutionContext(undefined);

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });
  });

  describe('canActivate - Guards Configuration Validation', () => {
    it('should throw OAuthConfigNotAvailableException when guards record is not found', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithoutGuards = new OAuthGuard(
        null as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithoutGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthConfigNotAvailableException);
      }
    });

    it('should throw OAuthConfigNotAvailableException when guards record is undefined', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithUndefinedGuards = new OAuthGuard(
        undefined as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithUndefinedGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthConfigNotAvailableException);
      }
    });

    it('should throw OAuthConfigNotAvailableException when guards record is not an object', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithInvalidGuards = new OAuthGuard(
        'not an object' as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithInvalidGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthConfigNotAvailableException);
      }
    });
  });

  describe('canActivate - Provider Support Validation', () => {
    it('should throw OAuthProviderNotSupportedException when provider is not in guards record', async () => {
      mockExecutionContext = createMockExecutionContext('unsupported');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderNotSupportedException);
      }
    });

    it('should throw OAuthProviderNotSupportedException with correct provider name', async () => {
      mockExecutionContext = createMockExecutionContext('facebook');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderNotSupportedException);
        expect(
          (error as OAuthProviderNotSupportedException).safeMessage,
        ).toContain('facebook');
      }
    });
  });

  describe('canActivate - Guard Instance Validation', () => {
    it('should throw OAuthGuardInvalidException when guard instance canActivate is not a function', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: {
          canActivate: 'not a function',
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthGuardInvalidException);
      }
    });
  });

  describe('canActivate - Guard Execution Success Cases', () => {
    it('should return true when guard returns boolean true', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false when guard returns boolean false', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: new MockFailureGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true when guard returns Promise<true>', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: new MockAsyncSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('canActivate - Guard Execution Error Cases', () => {
    it('should throw OAuthAuthenticationFailedException when guard throws error', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: new MockErrorGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthAuthenticationFailedException);
      }
    });

    it('should throw OAuthAuthenticationFailedException when async guard throws error', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: new MockAsyncErrorGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthAuthenticationFailedException);
      }
    });

    it('should include provider name in OAuthAuthenticationFailedException', async () => {
      mockExecutionContext = createMockExecutionContext('github');
      mockOAuthGuards = {
        github: new MockErrorGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthAuthenticationFailedException);
        expect(
          (error as OAuthAuthenticationFailedException).safeMessage,
        ).toContain('github');
        expect(
          (error as OAuthAuthenticationFailedException).safeMessage,
        ).toContain('Mock guard error');
      }
    });

    it('should handle unknown error types in OAuthAuthenticationFailedException', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: {
          canActivate: () => {
            throw 'String error'; // Non-Error object
          },
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthAuthenticationFailedException);
        expect(
          (error as OAuthAuthenticationFailedException).safeMessage,
        ).toContain('Unknown error');
      }
    });
  });

  describe('canActivate - Exception Re-throwing', () => {
    it('should re-throw OAuthProviderMissingException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext();

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });

    it('should re-throw OAuthConfigNotAvailableException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithoutGuards = new OAuthGuard(
        null as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithoutGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthConfigNotAvailableException);
      }
    });

    it('should re-throw OAuthProviderNotSupportedException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('unsupported');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderNotSupportedException);
      }
    });

    it('should re-throw OAuthGuardInvalidException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockOAuthGuards = {
        google: {
          canActivate: 'not a function',
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthGuardInvalidException);
      }
    });
  });

  describe('canActivate - Edge Cases', () => {
    it('should handle multiple providers in guards record correctly', async () => {
      mockExecutionContext = createMockExecutionContext('github');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
        github: new MockFailureGuard(),
        facebook: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(false); // github guard returns false
    });

    it('should handle provider name case sensitivity', async () => {
      mockExecutionContext = createMockExecutionContext('Google');
      mockOAuthGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new OAuthGuard(mockOAuthGuards);

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderNotSupportedException);
      }
    });

    it('should handle empty provider name', async () => {
      mockExecutionContext = createMockExecutionContext('   ');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });

    it('should handle whitespace-only provider name', async () => {
      mockExecutionContext = createMockExecutionContext('   ');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OAuthProviderMissingException);
      }
    });
  });
});
