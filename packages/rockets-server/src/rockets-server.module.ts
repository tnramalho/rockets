import { DynamicModule, Module } from '@nestjs/common';

import {
  RocketsServerAsyncOptions,
  RocketsServerOptions,
  RocketsServerModuleClass,
} from './rockets-server.module-definition';

/**
 * Combined authentication module that provides all authentication options features
 *
 * This module combines the options for the following modules:
 * - JwtModule: For JWT token handling
 * - AuthenticationModule: For core authentication services
 * - AuthJwtModule: For JWT-based authentication (optional)
 * - AuthRefreshModule: For refresh token handling (optional)
 */
@Module({})
export class RocketsServerModule extends RocketsServerModuleClass {
  static forRoot(options: RocketsServerOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: RocketsServerAsyncOptions): DynamicModule {
    return super.registerAsync({
      ...options,
      global: true,
    });
  }
}
