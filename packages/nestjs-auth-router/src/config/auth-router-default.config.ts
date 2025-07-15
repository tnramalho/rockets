import { registerAs } from '@nestjs/config';

import { AUTH_ROUTER_MODULE_DEFAULT_SETTINGS_TOKEN } from '../auth-router.constants';
import { AuthRouterSettingsInterface } from '../interfaces/auth-router-settings.interface';

/**
 * Default configuration for auth router.
 */
export const authRouterDefaultConfig = registerAs(
  AUTH_ROUTER_MODULE_DEFAULT_SETTINGS_TOKEN,
  (): AuthRouterSettingsInterface => ({}),
);
