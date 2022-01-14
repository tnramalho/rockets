import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import {
  AsyncModuleConfig,
  createConfigurableDynamicRootModule,
  deferExternal,
  DeferExternalOptionsInterface,
} from '@rockts-org/nestjs-common';
import {
  createCustomRepositoryProvider,
  createEntityRepositoryProvider,
  TypeOrmExtModule,
} from '@rockts-org/nestjs-typeorm-ext';
import { UserRepository } from './user.repository';
import { userDefaultConfig } from './config/user-default.config';
import { User } from './entities/user.entity';
import { UserOptionsInterface } from './interfaces/user-options.interface';
import { UserOrmOptionsInterface } from './interfaces/user-orm-options.interface';
import { UserService } from './services/user.service';
import {
  USER_MODULE_OPTIONS_TOKEN,
  USER_MODULE_USER_ENTITY_REPO_TOKEN,
  USER_MODULE_USER_CUSTOM_REPO_TOKEN,
  USER_MODULE_SETTINGS_TOKEN,
} from './user.constants';
import { UserController } from './user.controller';
import { UserServiceInterface } from './interfaces/user-service.interface';
import { DefaultUserService } from './services/default-user.service';

@Module({
  providers: [DefaultUserService, UserController],
  exports: [UserService, UserController],
  controllers: [UserController],
})
@Injectable()
export class UserModule extends createConfigurableDynamicRootModule<
  UserModule,
  UserOptionsInterface
>(USER_MODULE_OPTIONS_TOKEN, {
  imports: [ConfigModule.forFeature(userDefaultConfig)],
  providers: [
    {
      provide: USER_MODULE_SETTINGS_TOKEN,
      inject: [USER_MODULE_OPTIONS_TOKEN, userDefaultConfig.KEY],
      useFactory: async (
        options: UserOptionsInterface,
        defaultSettings: ConfigType<typeof userDefaultConfig>,
      ) => options.settings ?? defaultSettings,
    },
    {
      provide: UserService,
      inject: [USER_MODULE_OPTIONS_TOKEN, DefaultUserService],
      useFactory: async (
        options: UserOptionsInterface,
        defaultService: UserServiceInterface,
      ) => options.userService ?? defaultService,
    },
    createEntityRepositoryProvider(USER_MODULE_USER_ENTITY_REPO_TOKEN, 'user'),
    createCustomRepositoryProvider(
      USER_MODULE_USER_CUSTOM_REPO_TOKEN,
      'userRepository',
    ),
  ],
  exports: [
    USER_MODULE_USER_ENTITY_REPO_TOKEN,
    USER_MODULE_USER_CUSTOM_REPO_TOKEN,
  ],
}) {
  static register(
    options: UserOptionsInterface & UserOrmOptionsInterface = {},
  ) {
    this.configureOrm(options);
    return UserModule.forRoot(UserModule, options);
  }

  static registerAsync(
    options: AsyncModuleConfig<UserOptionsInterface> & UserOrmOptionsInterface,
  ) {
    this.configureOrm(options);
    return UserModule.forRootAsync(UserModule, {
      useFactory: () => ({}),
      ...options,
    });
  }

  static deferred(options: DeferExternalOptionsInterface = {}) {
    return deferExternal<UserModule, UserOptionsInterface>(UserModule, options);
  }

  private static configureOrm(options: UserOrmOptionsInterface) {
    TypeOrmExtModule.configure(options.orm, {
      entities: {
        user: { useClass: User },
      },
      repositories: {
        userRepository: { useClass: UserRepository },
      },
    });
  }
}
