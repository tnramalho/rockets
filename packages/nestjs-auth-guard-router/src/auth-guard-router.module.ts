import { DynamicModule, Module } from '@nestjs/common';

import {
  AuthGuardRouterAsyncOptions,
  AuthGuardRouterModuleClass,
  AuthGuardRouterOptions,
} from './auth-guard-router.module-definition';

/**
 * Auth Guard Router module
 */
@Module({})
export class AuthGuardRouterModule extends AuthGuardRouterModuleClass {
  static register(options: AuthGuardRouterOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: AuthGuardRouterAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: AuthGuardRouterOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: AuthGuardRouterAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }
}
