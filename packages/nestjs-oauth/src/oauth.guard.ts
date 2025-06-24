import { firstValueFrom, isObservable } from 'rxjs';

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
} from '@nestjs/common';

import {
  OAuthProviderMissingException,
  OAuthProviderNotSupportedException,
  OAuthConfigNotAvailableException,
  OAuthGuardInvalidException,
  OAuthAuthenticationFailedException,
  OAuthException,
} from './exceptions';
import { OAUTH_MODULE_GUARDS_TOKEN } from './oauth.constants';
import { OAuthGuardsRecord } from './oauth.types';
import { AuthGuardInterface } from '@concepta/nestjs-authentication';

/**
 * OAuth Guard
 *
 * This guard is responsible for handling OAuth authentication by delegating
 * to provider-specific guards based on the 'provider' query parameter.
 */
@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(
    @Inject(OAUTH_MODULE_GUARDS_TOKEN)
    private readonly allOAuthGuards: OAuthGuardsRecord,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provider = request.query?.provider as string;

    if (!provider) {
      throw new OAuthProviderMissingException();
    }

    const trimmedProvider = provider.trim();
    if (!trimmedProvider) {
      throw new OAuthProviderMissingException();
    }

    if (!this.allOAuthGuards || typeof this.allOAuthGuards !== 'object') {
      throw new OAuthConfigNotAvailableException();
    }

    try {
      const guardInstance = this.getProviderGuard(trimmedProvider);
      const result = guardInstance.canActivate(context);

      // Handle Observable, Promise, or boolean return types
      if (isObservable(result)) {
        return (await firstValueFrom(result)) as boolean;
      } else if (result instanceof Promise) {
        return (await result) as boolean;
      } else {
        return result as boolean;
      }
    } catch (error) {
      // Re-throw our custom OAuth exceptions
      if (error instanceof OAuthException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new OAuthAuthenticationFailedException(
        trimmedProvider,
        errorMessage,
      );
    }
  }

  /**
   * Get the guard instance for the given provider.
   * Similar to CacheService.getAssignmentRepo()
   *
   * @internal
   * @param provider - The OAuth provider name
   */
  protected getProviderGuard(provider: string): AuthGuardInterface {
    // Get the guard instance from the injected guards record
    const guardInstance = this.allOAuthGuards[provider];

    if (!guardInstance) {
      throw new OAuthProviderNotSupportedException(provider);
    }

    if (typeof guardInstance.canActivate !== 'function') {
      throw new OAuthGuardInvalidException(provider);
    }

    return guardInstance;
  }
}
