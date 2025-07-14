import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Provider,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthGuardInterface } from '@concepta/nestjs-authentication';
import { createSettingsProvider } from '@concepta/nestjs-common';

import {
  AUTH_GUARD_ROUTER_MODULE_SETTINGS_TOKEN,
  AuthGuardRouterModuleGuards,
} from './auth-guard-router.constants';
import { AuthGuardRouterGuardsRecord } from './auth-guard-router.types';
import { authGuardRouterDefaultConfig } from './config/auth-guard-router-default.config';
import { AuthGuardRouterOptionsExtrasInterface } from './interfaces/auth-guard-router-options-extras.interface';
import { AuthGuardRouterOptionsInterface } from './interfaces/auth-guard-router-options.interface';
import { AuthGuardRouterSettingsInterface } from './interfaces/auth-guard-router-settings.interface';

const RAW_OPTIONS_TOKEN = Symbol(
  '__AUTH_GUARD_ROUTER_MODULE_RAW_OPTIONS_TOKEN__',
);

export const {
  ConfigurableModuleClass: AuthGuardRouterModuleClass,
  OPTIONS_TYPE: AUTH_GUARD_ROUTER_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: AUTH_GUARD_ROUTER_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AuthGuardRouterOptionsInterface>({
  moduleName: 'AuthGuardRouter',
  optionsInjectionToken: RAW_OPTIONS_TOKEN,
})
  .setExtras<AuthGuardRouterOptionsExtrasInterface>(
    { global: false, guards: [] },
    definitionTransform,
  )
  .build();

export type AuthGuardRouterOptions = Omit<
  typeof AUTH_GUARD_ROUTER_OPTIONS_TYPE,
  'global'
>;
export type AuthGuardRouterAsyncOptions = Omit<
  typeof AUTH_GUARD_ROUTER_ASYNC_OPTIONS_TYPE,
  'global'
>;

function definitionTransform(
  definition: DynamicModule,
  extras: AuthGuardRouterOptionsExtrasInterface,
): DynamicModule {
  const { providers = [] } = definition;
  const { global = false } = extras;

  return {
    ...definition,
    global,
    imports: createAuthGuardRouterImports(),
    providers: createAuthGuardRouterProviders({ providers, extras }),
    exports: [
      ConfigModule,
      RAW_OPTIONS_TOKEN,
      ...createAuthGuardRouterExports(extras),
    ],
  };
}

export function createAuthGuardRouterImports(): DynamicModule['imports'] {
  return [ConfigModule.forFeature(authGuardRouterDefaultConfig)];
}

export function createAuthGuardRouterExports(
  extras?: AuthGuardRouterOptionsExtrasInterface,
) {
  return [
    AUTH_GUARD_ROUTER_MODULE_SETTINGS_TOKEN,
    AuthGuardRouterModuleGuards,
    ...(extras?.guards?.map((config) => config.guard) ?? []),
  ];
}

export function createAuthGuardRouterProviders(options: {
  overrides?: AuthGuardRouterOptions;
  providers?: Provider[];
  extras?: AuthGuardRouterOptionsExtrasInterface;
}): Provider[] {
  return [
    ...(options.providers ?? []),
    createAuthGuardRouterSettingsProvider(options.overrides),
    ...createAuthGuardRouterGuardsProvider(options.extras),
  ];
}

export function createAuthGuardRouterSettingsProvider(
  optionsOverrides?: AuthGuardRouterOptions,
): Provider {
  return createSettingsProvider<
    AuthGuardRouterSettingsInterface,
    AuthGuardRouterOptionsInterface
  >({
    settingsToken: AUTH_GUARD_ROUTER_MODULE_SETTINGS_TOKEN,
    optionsToken: RAW_OPTIONS_TOKEN,
    settingsKey: authGuardRouterDefaultConfig.KEY,
    optionsOverrides,
  });
}

export function createAuthGuardRouterGuardsProvider(
  extras?: AuthGuardRouterOptionsExtrasInterface,
): Provider[] {
  const { guards = [] } = extras || {};

  // Get unique guard classes to inject
  const guardsToInject = [];
  const providerTracker: Record<string, number> = {};

  let guardIdx = 0;

  for (const guardConfig of guards) {
    guardsToInject[guardIdx] = guardConfig.guard;
    providerTracker[guardConfig.name] = guardIdx++;
  }

  return [
    // Register each guard as a provider
    ...guards.map((config) => config.guard),
    // Create the guards record provider
    {
      provide: AuthGuardRouterModuleGuards,
      inject: guardsToInject,
      useFactory: (
        ...args: AuthGuardInterface[]
      ): AuthGuardRouterGuardsRecord => {
        const guardInstances: AuthGuardRouterGuardsRecord = {};

        for (const guardConfig of guards) {
          guardInstances[guardConfig.name] =
            args[providerTracker[guardConfig.name]];
        }

        return guardInstances;
      },
    },
  ];
}
