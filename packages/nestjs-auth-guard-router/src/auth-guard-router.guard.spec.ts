import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthGuardInterface } from '@concepta/nestjs-authentication';

import { AuthGuardRouterModuleGuards } from './auth-guard-router.constants';
import { AuthGuardRouterGuard } from './auth-guard-router.guard';
import {
  AuthGuardRouterAuthenticationFailedException,
  AuthGuardRouterConfigNotAvailableException,
  AuthGuardRouterGuardInvalidException,
  AuthGuardRouterProviderMissingException,
  AuthGuardRouterProviderNotSupportedException,
} from './exceptions';

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

describe(AuthGuardRouterGuard.name, () => {
  let guard: AuthGuardRouterGuard;
  let mockExecutionContext: ExecutionContext;
  let mockAuthGuardRouterGuards: Record<string, AuthGuardInterface>;

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
    mockAuthGuardRouterGuards = {
      google: new MockSuccessGuard(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuardRouterGuard,
        {
          provide: AuthGuardRouterModuleGuards,
          useValue: mockAuthGuardRouterGuards,
        },
      ],
    }).compile();

    guard = module.get<AuthGuardRouterGuard>(AuthGuardRouterGuard);
  });

  describe('Guard Instance', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should be an instance of AuthGuardRouterGuard', () => {
      expect(guard).toBeInstanceOf(AuthGuardRouterGuard);
    });
  });

  describe('canActivate - Provider Validation', () => {
    it('should throw AuthGuardRouterProviderMissingException when provider is missing', async () => {
      mockExecutionContext = createMockExecutionContext();

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });

    it('should throw AuthGuardRouterProviderMissingException when provider is empty string', async () => {
      mockExecutionContext = createMockExecutionContext('');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });

    it('should throw AuthGuardRouterProviderMissingException when provider is null', async () => {
      mockExecutionContext = createMockExecutionContext(
        null as unknown as string,
      );

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });

    it('should throw AuthGuardRouterProviderMissingException when provider is undefined', async () => {
      mockExecutionContext = createMockExecutionContext(undefined);

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });
  });

  describe('canActivate - Guards Configuration Validation', () => {
    it('should throw AuthGuardRouterConfigNotAvailableException when guards record is not found', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithoutGuards = new AuthGuardRouterGuard(
        null as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithoutGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterConfigNotAvailableException,
        );
      }
    });

    it('should throw AuthGuardRouterConfigNotAvailableException when guards record is undefined', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithUndefinedGuards = new AuthGuardRouterGuard(
        undefined as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithUndefinedGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterConfigNotAvailableException,
        );
      }
    });

    it('should throw AuthGuardRouterConfigNotAvailableException when guards record is not an object', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithInvalidGuards = new AuthGuardRouterGuard(
        'not an object' as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithInvalidGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterConfigNotAvailableException,
        );
      }
    });
  });

  describe('canActivate - Provider Support Validation', () => {
    it('should throw AuthGuardRouterProviderNotSupportedException when provider is not in guards record', async () => {
      mockExecutionContext = createMockExecutionContext('unsupported');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterProviderNotSupportedException,
        );
      }
    });

    it('should throw AuthGuardRouterProviderNotSupportedException with correct provider name', async () => {
      mockExecutionContext = createMockExecutionContext('facebook');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterProviderNotSupportedException,
        );
        expect(
          (error as AuthGuardRouterProviderNotSupportedException).safeMessage,
        ).toContain('facebook');
      }
    });
  });

  describe('canActivate - Guard Instance Validation', () => {
    it('should throw AuthGuardRouterGuardInvalidException when guard instance canActivate is not a function', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: {
          canActivate: 'not a function',
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterGuardInvalidException);
      }
    });
  });

  describe('canActivate - Guard Execution Success Cases', () => {
    it('should return true when guard returns boolean true', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false when guard returns boolean false', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: new MockFailureGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true when guard returns Promise<true>', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: new MockAsyncSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('canActivate - Guard Execution Error Cases', () => {
    it('should throw AuthGuardRouterAuthenticationFailedException when guard throws error', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: new MockErrorGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterAuthenticationFailedException,
        );
      }
    });

    it('should throw AuthGuardRouterAuthenticationFailedException when async guard throws error', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: new MockAsyncErrorGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterAuthenticationFailedException,
        );
      }
    });

    it('should include provider name in AuthGuardRouterAuthenticationFailedException', async () => {
      mockExecutionContext = createMockExecutionContext('github');
      mockAuthGuardRouterGuards = {
        github: new MockErrorGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterAuthenticationFailedException,
        );
        expect(
          (error as AuthGuardRouterAuthenticationFailedException).safeMessage,
        ).toContain('github');
        expect(
          (error as AuthGuardRouterAuthenticationFailedException).safeMessage,
        ).toContain('Mock guard error');
      }
    });

    it('should handle unknown error types in AuthGuardRouterAuthenticationFailedException', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: {
          canActivate: () => {
            throw 'String error'; // Non-Error object
          },
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterAuthenticationFailedException,
        );
        expect(
          (error as AuthGuardRouterAuthenticationFailedException).safeMessage,
        ).toContain('Unknown error');
      }
    });
  });

  describe('canActivate - Exception Re-throwing', () => {
    it('should re-throw AuthGuardRouterProviderMissingException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext();

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });

    it('should re-throw AuthGuardRouterConfigNotAvailableException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('google');

      const guardWithoutGuards = new AuthGuardRouterGuard(
        null as unknown as Record<string, AuthGuardInterface>,
      );

      try {
        await guardWithoutGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterConfigNotAvailableException,
        );
      }
    });

    it('should re-throw AuthGuardRouterProviderNotSupportedException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('unsupported');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterProviderNotSupportedException,
        );
      }
    });

    it('should re-throw AuthGuardRouterGuardInvalidException without wrapping', async () => {
      mockExecutionContext = createMockExecutionContext('google');
      mockAuthGuardRouterGuards = {
        google: {
          canActivate: 'not a function',
        } as unknown as AuthGuardInterface,
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterGuardInvalidException);
      }
    });
  });

  describe('canActivate - Edge Cases', () => {
    it('should handle multiple providers in guards record correctly', async () => {
      mockExecutionContext = createMockExecutionContext('github');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
        github: new MockFailureGuard(),
        facebook: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );
      const result = await guardWithGuards.canActivate(mockExecutionContext);

      expect(result).toBe(false); // github guard returns false
    });

    it('should handle provider name case sensitivity', async () => {
      mockExecutionContext = createMockExecutionContext('Google');
      mockAuthGuardRouterGuards = {
        google: new MockSuccessGuard(),
      };

      const guardWithGuards = new AuthGuardRouterGuard(
        mockAuthGuardRouterGuards,
      );

      try {
        await guardWithGuards.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(
          AuthGuardRouterProviderNotSupportedException,
        );
      }
    });

    it('should handle empty provider name', async () => {
      mockExecutionContext = createMockExecutionContext('   ');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });

    it('should handle whitespace-only provider name', async () => {
      mockExecutionContext = createMockExecutionContext('   ');

      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthGuardRouterProviderMissingException);
      }
    });
  });
});
