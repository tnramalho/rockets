import { registerAs } from '@nestjs/config';

import { RoleSettingsInterface } from '../interfaces/role-settings.interface';
import { ROLE_MODULE_DEFAULT_SETTINGS_TOKEN } from '../role.constants';

/**
 * Default configuration for Role module.
 */
export const roleDefaultConfig = registerAs(
  ROLE_MODULE_DEFAULT_SETTINGS_TOKEN,
  (): Partial<RoleSettingsInterface> => ({}),
);
