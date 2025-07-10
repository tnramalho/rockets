export { AuthGuardRouterModule } from './auth-guard-router.module';

export {
  AuthGuardRouterGuard,
  AuthGuardRouterGuard as AuthGuardRouterAuthGuard,
} from './auth-guard-router.guard';

export { AuthGuardRouterGuardsRecord } from './auth-guard-router.types';

export { AuthGuardRouterException } from './exceptions/auth-guard-router.exception';

// Export configuration types
export {
  AuthGuardRouterOptions,
  AuthGuardRouterAsyncOptions,
} from './auth-guard-router.module-definition';
// Export interfaces
export { AuthGuardRouterOptionsInterface } from './interfaces/auth-guard-router-options.interface';
export { AuthGuardRouterSettingsInterface } from './interfaces/auth-guard-router-settings.interface';
export { AuthGuardRouterOptionsExtrasInterface } from './interfaces/auth-guard-router-options-extras.interface';
export { AuthGuardRouterGuardConfigInterface } from './interfaces/auth-guard-router-guard-config.interface';

export { AuthGuardRouterModuleGuards } from './auth-guard-router.constants';
