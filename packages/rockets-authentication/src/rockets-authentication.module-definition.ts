import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Provider,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authenticationOptionsDefaultConfig } from './config/rockets-authentication-options-default.config';
import { AuthenticationModule } from '@concepta/nestjs-authentication';

import { JwtModule } from '@concepta/nestjs-jwt';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthRefreshModule } from '@concepta/nestjs-auth-refresh';
import { RocketsAuthenticationOptionsExtrasInterface } from './interfaces/rockets-authentication-options-extras.interface';
import { RocketsAuthenticationOptionsInterface } from './interfaces/rockets-authentication-options.interface';
import { AuthJwtOptionsInterface } from '@concepta/nestjs-auth-jwt/dist/interfaces/auth-jwt-options.interface';
import { AuthRefreshOptionsInterface } from '@concepta/nestjs-auth-refresh/dist/interfaces/auth-refresh-options.interface';
import { JwtOptionsInterface } from '@concepta/nestjs-jwt/dist/interfaces/jwt-options.interface';

const RAW_OPTIONS_TOKEN = Symbol(
  '__ROCKETS_AUTHENTICATION_MODULE_RAW_OPTIONS_TOKEN__',
);

export const {
  ConfigurableModuleClass: AuthenticationModuleClass,
  OPTIONS_TYPE: ROCKETS_AUTHENTICATION_MODULE_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: ROCKETS_AUTHENTICATION_MODULE_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<RocketsAuthenticationOptionsInterface>({
  moduleName: 'AuthenticationCombined',
  optionsInjectionToken: RAW_OPTIONS_TOKEN,
})
  .setExtras<RocketsAuthenticationOptionsExtrasInterface>(
    { global: false },
    definitionTransform,
  )
  .build();

export type AuthenticationCombinedOptions = Omit<
  typeof ROCKETS_AUTHENTICATION_MODULE_OPTIONS_TYPE,
  'global'
>;

export type AuthenticationCombinedAsyncOptions = Omit<
  typeof ROCKETS_AUTHENTICATION_MODULE_ASYNC_OPTIONS_TYPE,
  'global'
>;

/**
 * Transform the definition to include the combined modules
 */
function definitionTransform(
  definition: DynamicModule,
  extras: RocketsAuthenticationOptionsExtrasInterface,
): DynamicModule {
  const { imports = [], providers = [], exports = [] } = definition;

  return {
    ...definition,
    global: extras.global,
    imports: createAuthenticationOptionsImports({ imports }),
    providers: createAuthenticationOptionsProviders({ providers }),
    exports: createAuthenticationOptionsExports({ exports }),
  };
}

/**
 * Create imports for the combined module
 */
export function createAuthenticationOptionsImports(options: {
  imports: DynamicModule['imports'];
}): DynamicModule['imports'] {
  return [
    ...(options.imports || []),
    ConfigModule.forFeature(authenticationOptionsDefaultConfig),
    AuthenticationModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (options: RocketsAuthenticationOptionsInterface) => {
        return {
          verifyTokenService:
            options.authentication?.verifyTokenService ||
            options.services?.verifyTokenService,
          issueTokenService:
            options.authentication?.issueTokenService ||
            options.services?.issueTokenService,
          validateTokenService:
            options.authentication?.validateTokenService ||
            options.services?.validateTokenService,
          settings: options.authentication?.settings,
        };
      },
    }),
    JwtModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): JwtOptionsInterface => {
        return {
          jwtIssueTokenService:
            options.jwt?.jwtIssueTokenService ||
            options.services?.jwtIssueTokenService,
          jwtRefreshService:
            options.jwt?.jwtRefreshService ||
            options.services?.jwtRefreshService,
          jwtVerifyTokenService:
            options.jwt?.jwtVerifyTokenService ||
            options.services?.jwtVerifyTokenService,
          jwtAccessService:
            options.jwt?.jwtAccessService || options.services?.jwtAccessService,
          jwtService: options.jwt?.jwtService || options.services?.jwtService,
          settings: options.jwt?.settings,
        };
      },
    }),
    AuthJwtModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): AuthJwtOptionsInterface => {
        return {
          appGuard: options.authJwt?.appGuard,
          verifyTokenService:
            options.authJwt?.verifyTokenService ||
            options.services?.verifyTokenService,
          userLookupService:
            options.authJwt?.userLookupService ||
            options.services?.userLookupService,
          settings: options.authJwt?.settings,
        };
      },
    }),
    AuthRefreshModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): AuthRefreshOptionsInterface => {
        return {
          verifyTokenService:
            options.refresh?.verifyTokenService ||
            options.services?.verifyTokenService,
          issueTokenService:
            options.refresh?.issueTokenService ||
            options.services?.issueTokenService,
          userLookupService:
            options.refresh?.userLookupService ||
            options.services?.userLookupService,
          settings: options.refresh?.settings,
        };
      },
    }),
  ];
}

/**
 * Create exports for the combined module
 */
export function createAuthenticationOptionsExports(options: {
  exports: DynamicModule['exports'];
}): DynamicModule['exports'] {
  return [
    ...(options.exports || []),
    ConfigModule,
    RAW_OPTIONS_TOKEN,
    JwtModule,
    AuthJwtModule,
    AuthRefreshModule,
  ];
}

/**
 * Create providers for the combined module
 */
export function createAuthenticationOptionsProviders(options: {
  providers?: Provider[];
}): Provider[] {
  return [...(options.providers ?? [])];
}
