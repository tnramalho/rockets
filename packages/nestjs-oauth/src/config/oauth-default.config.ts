import { registerAs } from '@nestjs/config';

import { OAuthSettingsInterface } from '../interfaces/oauth-settings.interface';
import { AUTH_OAUTH_MODULE_DEFAULT_SETTINGS_TOKEN } from '../oauth.constants';

/**
 * Default configuration for auth google.
 */
export const oAuthDefaultConfig = registerAs(
  AUTH_OAUTH_MODULE_DEFAULT_SETTINGS_TOKEN,
  (): OAuthSettingsInterface => ({}),
);
