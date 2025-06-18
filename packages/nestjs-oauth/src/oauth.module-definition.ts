import {
  CanActivate,
  ConfigurableModuleBuilder,
  DynamicModule,
  Provider,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { createSettingsProvider } from '@concepta/nestjs-common';

import { oAuthDefaultConfig } from './config/oauth-default.config';
import { OAuthOptionsExtrasInterface } from './interfaces/oauth-options-extras.interface';
import { OAuthOptionsInterface } from './interfaces/oauth-options.interface';
import { OAuthSettingsInterface } from './interfaces/oauth-settings.interface';
import {
  AUTH_OAUTH_MODULE_SETTINGS_TOKEN,
  OAUTH_MODULE_GUARDS_TOKEN,
} from './oauth.constants';
import { OAuthGuardsRecord } from './oauth.types';

const RAW_OPTIONS_TOKEN = Symbol('__AUTH_OAUTH_MODULE_RAW_OPTIONS_TOKEN__');

export const {
  ConfigurableModuleClass: OAuthModuleClass,
  OPTIONS_TYPE: AUTH_OAUTH_OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE: AUTH_OAUTH_ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<OAuthOptionsInterface>({
  moduleName: 'OAuth',
  optionsInjectionToken: RAW_OPTIONS_TOKEN,
})
  .setExtras<OAuthOptionsExtrasInterface>(
    { global: false, oAuthGuards: [] },
    definitionTransform,
  )
  .build();

export type OAuthOptions = Omit<typeof AUTH_OAUTH_OPTIONS_TYPE, 'global'>;
export type OAuthAsyncOptions = Omit<
  typeof AUTH_OAUTH_ASYNC_OPTIONS_TYPE,
  'global'
>;

function definitionTransform(
  definition: DynamicModule,
  extras: OAuthOptionsExtrasInterface,
): DynamicModule {
  const { providers = [], imports = [] } = definition;
  const { global = false } = extras;

  return {
    ...definition,
    global,
    imports: createOAuthImports({ imports }),
    providers: createOAuthProviders({ providers, extras }),
    exports: [ConfigModule, RAW_OPTIONS_TOKEN, ...createOAuthExports(extras)],
  };
}

export function createOAuthImports(options: {
  imports: DynamicModule['imports'];
}): DynamicModule['imports'] {
  return [
    ...(options.imports || []),
    ConfigModule.forFeature(oAuthDefaultConfig),
  ];
}

export function createOAuthExports(extras?: OAuthOptionsExtrasInterface) {
  return [
    AUTH_OAUTH_MODULE_SETTINGS_TOKEN,
    OAUTH_MODULE_GUARDS_TOKEN,
    ...(extras?.oAuthGuards?.map((config) => config.guard) ?? []),
  ];
}

export function createOAuthProviders(options: {
  overrides?: OAuthOptions;
  providers?: Provider[];
  extras?: OAuthOptionsExtrasInterface;
}): Provider[] {
  return [
    ...(options.providers ?? []),
    createOAuthOptionsProvider(options.overrides),
    ...createOAuthGuardsProvider(options.extras),
  ];
}

export function createOAuthOptionsProvider(
  optionsOverrides?: OAuthOptions,
): Provider {
  return createSettingsProvider<OAuthSettingsInterface, OAuthOptionsInterface>({
    settingsToken: AUTH_OAUTH_MODULE_SETTINGS_TOKEN,
    optionsToken: RAW_OPTIONS_TOKEN,
    settingsKey: oAuthDefaultConfig.KEY,
    optionsOverrides,
  });
}

export function createOAuthGuardsProvider(
  extras?: OAuthOptionsExtrasInterface,
): Provider[] {
  const { oAuthGuards = [] } = extras || {};

  // Get unique guard classes to inject
  const guardsToInject = [];
  const providerTracker: Record<string, number> = {};

  let guardIdx = 0;

  for (const guardConfig of oAuthGuards) {
    guardsToInject[guardIdx] = guardConfig.guard;
    providerTracker[guardConfig.name] = guardIdx++;
  }

  return [
    // Register each guard as a provider
    ...oAuthGuards.map((config) => config.guard),
    // Create the guards record provider
    {
      provide: OAUTH_MODULE_GUARDS_TOKEN,
      inject: guardsToInject,
      useFactory: (...args: CanActivate[]): OAuthGuardsRecord => {
        const guardInstances: OAuthGuardsRecord = {};

        for (const guardConfig of oAuthGuards) {
          guardInstances[guardConfig.name] =
            args[providerTracker[guardConfig.name]];
        }

        return guardInstances;
      },
    },
  ];
}
