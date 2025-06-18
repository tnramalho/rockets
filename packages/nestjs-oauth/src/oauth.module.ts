import { DynamicModule, Module } from '@nestjs/common';

import {
  OAuthAsyncOptions,
  OAuthModuleClass,
  OAuthOptions,
} from './oauth.module-definition';

/**
 * Auth OAuth module
 */
@Module({})
export class OAuthModule extends OAuthModuleClass {
  static register(options: OAuthOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: OAuthAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: OAuthOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: OAuthAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }
}
