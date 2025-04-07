import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Provider,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authenticationOptionsDefaultConfig } from './config/rockets-authentication-options-default.config';
import { AuthenticationModule } from '@concepta/nestjs-authentication';
import { AuthLocalModule } from '@concepta/nestjs-auth-local';
import { AuthRecoveryModule } from '@concepta/nestjs-auth-recovery';

import { JwtModule } from '@concepta/nestjs-jwt';

import { AuthJwtModule } from '@concepta/nestjs-auth-jwt';
import { AuthRefreshModule } from '@concepta/nestjs-auth-refresh';
import { RocketsAuthenticationOptionsExtrasInterface } from './interfaces/rockets-authentication-options-extras.interface';
import { RocketsAuthenticationOptionsInterface } from './interfaces/rockets-authentication-options.interface';

import { AuthJwtOptionsInterface } from '@concepta/nestjs-auth-jwt/dist/interfaces/auth-jwt-options.interface';
import { AuthRefreshOptionsInterface } from '@concepta/nestjs-auth-refresh/dist/interfaces/auth-refresh-options.interface';
import { JwtOptionsInterface } from '@concepta/nestjs-jwt/dist/interfaces/jwt-options.interface';
import { AuthLocalOptionsInterface } from '@concepta/nestjs-auth-local/dist/interfaces/auth-local-options.interface';
import { AuthPasswordController } from './controllers/auth/auth-password.controller';
import { AuthTokenRefreshController } from './controllers/auth/auth-refresh.controller';
import { AuthRecoveryOptionsInterface } from '@concepta/nestjs-auth-recovery/dist/interfaces/auth-recovery-options.interface';
import { AuthVerifyModule, AuthVerifyUserMutateServiceInterface } from '@concepta/nestjs-auth-verify';
import { AuthVerifyOptionsInterface } from '@concepta/nestjs-auth-verify/dist/interfaces/auth-verify-options.interface';
import { AuthRecoveryUserMutateServiceInterface } from '@concepta/nestjs-auth-recovery/dist/interfaces/auth-recovery-user-mutate.service.interface';

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
  const { controllers } = extras;

  return {
    ...definition,
    global: extras.global,
    imports: createAuthenticationOptionsImports({ imports }),
    controllers: createAuthenticationOptionsControllers({ controllers }),
    providers: createAuthenticationOptionsProviders({ providers }),
    exports: createAuthenticationOptionsExports({ exports }),
  };
}

export function createAuthenticationOptionsControllers(options: {
  controllers?: DynamicModule['controllers'];
}): DynamicModule['controllers'] {
  return options?.controllers !== undefined
    ? options.controllers
    :
    [
      AuthPasswordController,
      AuthTokenRefreshController
    ];
}

/**
 * Create imports for the combined module
 */
export function createAuthenticationOptionsImports(options: {
  imports: DynamicModule['imports'],
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
      //TODO: make sure do clear initial controller
      controllers: [],
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
    AuthLocalModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): AuthLocalOptionsInterface => {
        return {
          passwordValidationService: options.authLocal?.passwordValidationService,
          validateUserService:
            options.authLocal?.validateUserService  ||
            options.services?.validateUserService,
          issueTokenService:
            options.authLocal?.issueTokenService ||
            options.services?.issueTokenService,
          userLookupService:
            options.authLocal?.userLookupService ||
            options.services?.userLookupService,
          settings: options.authLocal?.settings,
        };
      },
    }),
    AuthRecoveryModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): AuthRecoveryOptionsInterface => {
        return {
          emailService:
            options.authRecovery?.emailService ||
            options.services?.emailService,
          otpService: 
            options.authRecovery?.otpService ||
            options.services?.otpService,
          userLookupService:
            options.authRecovery?.userLookupService ||
            options.services?.userLookupService,
          userMutateService:
            (options.authRecovery?.userMutateService ||
            options.services.userMutateService) as AuthRecoveryUserMutateServiceInterface,
          entityManagerProxy: options.authRecovery?.entityManagerProxy,
          notificationService:
            options.authRecovery?.notificationService ||
            options.services?.notificationService,
          settings: options.authRecovery?.settings,
        };
      },
    }),
    AuthVerifyModule.forRootAsync({
      inject: [RAW_OPTIONS_TOKEN],
      useFactory: (
        options: RocketsAuthenticationOptionsInterface,
      ): AuthVerifyOptionsInterface => {
        return {
          emailService:
            options.authVerify?.emailService ||
            options.services?.emailService,
          otpService:
            options.authVerify?.otpService ||
            options.services?.otpService,
          userLookupService:
            options.authVerify?.userLookupService ||
            options.services?.userLookupService,
          // TODO: this user mutate service does not require password, but the one from recovery does
          userMutateService:
            (options.authVerify?.userMutateService ||
            options.services?.userMutateService) as AuthVerifyUserMutateServiceInterface,
          entityManagerProxy: options.authVerify?.entityManagerProxy,
          notificationService:
            options.authVerify?.notificationService ||
            options.services?.notificationService,
          settings: options.authVerify?.settings,
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
