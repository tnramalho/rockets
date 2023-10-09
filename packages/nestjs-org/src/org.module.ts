import { DynamicModule, Module } from '@nestjs/common';

import {
  OrgAsyncOptions,
  OrgModuleClass,
  OrgOptions,
  createOrgControllers,
  createOrgExports,
  createOrgImports,
  createOrgProviders,
} from './org.module-definition';

/**
 * Org Module
 */
@Module({})
export class OrgModule extends OrgModuleClass {
  static register(options: OrgOptions): DynamicModule {
    return super.register(options);
  }

  static registerAsync(options: OrgAsyncOptions): DynamicModule {
    return super.registerAsync(options);
  }

  static forRoot(options: OrgOptions): DynamicModule {
    return super.register({ ...options, global: true });
  }

  static forRootAsync(options: OrgAsyncOptions): DynamicModule {
    return super.registerAsync({ ...options, global: true });
  }

  static forFeature(options: OrgOptions): DynamicModule {
    const { entities } = options;

    if (!entities) {
      throw new Error('You must provide the entities option');
    }

    return {
      module: OrgModule,
      imports: createOrgImports({ entities }),
      providers: createOrgProviders({ overrides: options }),
      exports: createOrgExports(),
      controllers: createOrgControllers(options),
    };
  }
}
