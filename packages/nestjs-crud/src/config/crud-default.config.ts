import { registerAs } from '@nestjs/config';

import {
  CRUD_MODULE_DEFAULT_SETTINGS_TOKEN,
  CRUD_MODULE_DEFAULT_TRANSFORM_OPTIONS,
} from '../crud.constants';
import { CrudSettingsInterface } from '../interfaces/crud-settings.interface';

/**
 * Default configuration for crud.
 */
export const crudDefaultConfig = registerAs(
  CRUD_MODULE_DEFAULT_SETTINGS_TOKEN,
  (): CrudSettingsInterface => ({
    serialization: {
      toInstanceOptions: CRUD_MODULE_DEFAULT_TRANSFORM_OPTIONS,
      toPlainOptions: CRUD_MODULE_DEFAULT_TRANSFORM_OPTIONS,
    },
  }),
);
