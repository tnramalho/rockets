import { ModuleOptionsSettingsInterface } from '@concepta/nestjs-common';

import { OAuthSettingsInterface } from './oauth-settings.interface';

export interface OAuthOptionsInterface
  extends ModuleOptionsSettingsInterface<OAuthSettingsInterface> {
  /**
   * Settings
   */
  settings?: OAuthSettingsInterface;
}
