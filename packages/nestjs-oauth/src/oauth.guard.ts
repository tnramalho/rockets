import { firstValueFrom, isObservable } from 'rxjs';

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';

import { AuthGuardInterface } from '@concepta/nestjs-authentication';

import {
  OAuthProviderMissingException,
  OAuthProviderNotSupportedException,
  OAuthConfigNotAvailableException,
  OAuthGuardInvalidException,
  OAuthAuthenticationFailedException,
  OAuthException,
} from './exceptions';
import { OAuthModuleGuards } from './oauth.constants';
import { OAuthGuardsRecord } from './oauth.types';

/**
 * OAuth Guard
 *
 * This guard is responsible for handling OAuth authentication by delegating
 * to provider-specific guards based on the 'provider' query parameter.
 */
@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(
    @Inject(OAuthModuleGuards)
    private readonly allOAuthGuards: OAuthGuardsRecord,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const provider = request.query?.provider as string;
    const code = request.query?.code as string;
    const state = request.query?.state as string;

    // Handle callback case (when code is present)
    if (code) {
      let callbackProvider = provider;

      // If no provider in query, try to extract from state parameter
      if (!callbackProvider && state) {
        try {
          // The state parameter might be a JSON string containing provider info
          const stateData = JSON.parse(state);
          callbackProvider = stateData.provider;
        } catch (error) {}
      }

      if (!callbackProvider) {
        throw new OAuthProviderMissingException();
      }

      // Now proceed with the provider-specific guard
      return this.executeProviderGuard(callbackProvider?.trim(), context);
    }

    // Handle initial authorization request
    if (!provider) {
      throw new OAuthProviderMissingException();
    }

    const trimmedProvider = provider.trim();
    if (!trimmedProvider) {
      throw new OAuthProviderMissingException();
    }

    return this.executeProviderGuard(trimmedProvider, context);
  }

  private async executeProviderGuard(
    provider: string,
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      if (!this.allOAuthGuards || typeof this.allOAuthGuards !== 'object') {
        throw new OAuthConfigNotAvailableException();
      }

      const guardInstance = this.getProviderGuard(provider);
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
      throw new OAuthAuthenticationFailedException(provider, errorMessage);
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
