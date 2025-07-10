import { registerAs } from '@nestjs/config';

import { AUTH_AUTH_GUARD_ROUTER_MODULE_DEFAULT_SETTINGS_TOKEN } from '../auth-guard-router.constants';
import { AuthGuardRouterSettingsInterface } from '../interfaces/auth-guard-router-settings.interface';

/**
 * Default configuration for auth guard router.
 */
export const authGuardRouterDefaultConfig = registerAs(
  AUTH_AUTH_GUARD_ROUTER_MODULE_DEFAULT_SETTINGS_TOKEN,
  (): AuthGuardRouterSettingsInterface => ({}),
);
