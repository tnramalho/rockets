import { DynamicModule, Module } from '@nestjs/common';

import {
  AuthRouterAsyncOptions,
  AuthRouterModuleClass,
  AuthRouterOptions,
} from './auth-router.module-definition';

/**
 * Auth Router module
 */
@Module({})
export class AuthRouterModule extends AuthRouterModuleClass {
  static register(options: AuthRouterOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: AuthRouterAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: AuthRouterOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: AuthRouterAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }
}
