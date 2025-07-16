import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Provider,
  CanActivate,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { createSettingsProvider } from '@concepta/nestjs-common';

import {
  AUTH_ROUTER_MODULE_SETTINGS_TOKEN,
  AuthRouterModuleGuards,
} from './auth-router.constants';
import { AuthRouterGuardsRecord } from './auth-router.types';
import { authRouterDefaultConfig } from './config/auth-router-default.config';
import { AuthRouterOptionsExtrasInterface } from './interfaces/auth-router-options-extras.interface';
import { AuthRouterOptionsInterface } from './interfaces/auth-router-options.interface';
import { AuthRouterSettingsInterface } from './interfaces/auth-router-settings.interface';

const RAW_OPTIONS_TOKEN = Symbol('__AUTH_ROUTER_MODULE_RAW_OPTIONS_TOKEN__');

export const {
  ConfigurableModuleClass: AuthRouterModuleClass,
  OPTIONS_TYPE: AUTH_ROUTER_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: AUTH_ROUTER_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<AuthRouterOptionsInterface>({
  moduleName: 'AuthRouter',
  optionsInjectionToken: RAW_OPTIONS_TOKEN,
})
  .setExtras<AuthRouterOptionsExtrasInterface>(
    { global: false, guards: [] },
    definitionTransform,
  )
  .build();

export type AuthRouterOptions = Omit<typeof AUTH_ROUTER_OPTIONS_TYPE, 'global'>;
export type AuthRouterAsyncOptions = Omit<
  typeof AUTH_ROUTER_ASYNC_OPTIONS_TYPE,
  'global'
>;

function definitionTransform(
  definition: DynamicModule,
  extras: AuthRouterOptionsExtrasInterface,
): DynamicModule {
  const { providers = [] } = definition;
  const { global = false } = extras;

  return {
    ...definition,
    global,
    imports: createAuthRouterImports(),
    providers: createAuthRouterProviders({ providers, extras }),
    exports: [
      ConfigModule,
      RAW_OPTIONS_TOKEN,
      ...createAuthRouterExports(extras),
    ],
  };
}

export function createAuthRouterImports(): DynamicModule['imports'] {
  return [ConfigModule.forFeature(authRouterDefaultConfig)];
}

export function createAuthRouterExports(
  extras?: AuthRouterOptionsExtrasInterface,
) {
  return [
    AUTH_ROUTER_MODULE_SETTINGS_TOKEN,
    AuthRouterModuleGuards,
    ...(extras?.guards?.map((config) => config.guard) ?? []),
  ];
}

export function createAuthRouterProviders(options: {
  overrides?: AuthRouterOptions;
  providers?: Provider[];
  extras?: AuthRouterOptionsExtrasInterface;
}): Provider[] {
  return [
    ...(options.providers ?? []),
    createAuthRouterSettingsProvider(options.overrides),
    ...createAuthRouterGuardsProvider(options.extras),
  ];
}

export function createAuthRouterSettingsProvider(
  optionsOverrides?: AuthRouterOptions,
): Provider {
  return createSettingsProvider<
    AuthRouterSettingsInterface,
    AuthRouterOptionsInterface
  >({
    settingsToken: AUTH_ROUTER_MODULE_SETTINGS_TOKEN,
    optionsToken: RAW_OPTIONS_TOKEN,
    settingsKey: authRouterDefaultConfig.KEY,
    optionsOverrides,
  });
}

export function createAuthRouterGuardsProvider(
  extras?: AuthRouterOptionsExtrasInterface,
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
      provide: AuthRouterModuleGuards,
      inject: guardsToInject,
      useFactory: (...args: CanActivate[]): AuthRouterGuardsRecord => {
        const guardInstances: AuthRouterGuardsRecord = {};

        for (const guardConfig of guards) {
          guardInstances[guardConfig.name] =
            args[providerTracker[guardConfig.name]];
        }

        return guardInstances;
      },
    },
  ];
}
