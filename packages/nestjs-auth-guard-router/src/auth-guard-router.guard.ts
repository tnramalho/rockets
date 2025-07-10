import { firstValueFrom, isObservable } from 'rxjs';

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';

import { AuthGuardInterface } from '@concepta/nestjs-authentication';

import { AuthGuardRouterModuleGuards } from './auth-guard-router.constants';
import { AuthGuardRouterGuardsRecord } from './auth-guard-router.types';
import {
  AuthGuardRouterProviderMissingException,
  AuthGuardRouterProviderNotSupportedException,
  AuthGuardRouterConfigNotAvailableException,
  AuthGuardRouterGuardInvalidException,
  AuthGuardRouterAuthenticationFailedException,
  AuthGuardRouterException,
} from './exceptions';

/**
 * Auth Guard Router
 *
 * This guard is responsible for handling Auth Guard Router authentication by delegating
 * to provider-specific guards based on the 'provider' query parameter.
 */
@Injectable()
export class AuthGuardRouterGuard implements CanActivate {
  constructor(
    @Inject(AuthGuardRouterModuleGuards)
    private readonly allAuthGuardRouterGuards: AuthGuardRouterGuardsRecord,
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
        throw new AuthGuardRouterProviderMissingException();
      }

      // Now proceed with the provider-specific guard
      return this.executeProviderGuard(callbackProvider?.trim(), context);
    }

    // Handle initial authorization request
    if (!provider) {
      throw new AuthGuardRouterProviderMissingException();
    }

    const trimmedProvider = provider.trim();
    if (!trimmedProvider) {
      throw new AuthGuardRouterProviderMissingException();
    }

    return this.executeProviderGuard(trimmedProvider, context);
  }

  private async executeProviderGuard(
    provider: string,
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      if (
        !this.allAuthGuardRouterGuards ||
        typeof this.allAuthGuardRouterGuards !== 'object'
      ) {
        throw new AuthGuardRouterConfigNotAvailableException();
      }

      const guardInstance = this.getProviderGuard(provider);
      const result = guardInstance.canActivate(context);

      // Handle Observable, Promise, or boolean return types
      if (isObservable(result)) {
        const observableResult = await firstValueFrom(result);
        return Boolean(observableResult);
      } else if (result instanceof Promise) {
        const promiseResult = await result;
        return Boolean(promiseResult);
      } else {
        return Boolean(result);
      }
    } catch (error) {
      // Re-throw our custom Auth Guard Router exceptions
      if (error instanceof AuthGuardRouterException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new AuthGuardRouterAuthenticationFailedException(
        provider,
        errorMessage,
      );
    }
  }

  /**
   * Get the guard instance for the given provider.
   * Similar to CacheService.getAssignmentRepo()
   *
   * @internal
   * @param provider - The Auth Guard Router provider name
   */
  protected getProviderGuard(provider: string): AuthGuardInterface {
    // Get the guard instance from the injected guards record
    const guardInstance = this.allAuthGuardRouterGuards[provider];

    if (!guardInstance) {
      throw new AuthGuardRouterProviderNotSupportedException(provider);
    }

    if (typeof guardInstance.canActivate !== 'function') {
      throw new AuthGuardRouterGuardInvalidException(provider);
    }

    return guardInstance;
  }
}
