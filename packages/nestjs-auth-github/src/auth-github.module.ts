import { DynamicModule, Module } from '@nestjs/common';

import {
  AuthGithubAsyncOptions,
  AuthGithubModuleClass,
  AuthGithubOptions,
} from './auth-github.module-definition';

/**
 * Auth GitHub module
 */
@Module({})
export class AuthGithubModule extends AuthGithubModuleClass {
  static register(options: AuthGithubOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: AuthGithubAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: AuthGithubOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: AuthGithubAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }
}
