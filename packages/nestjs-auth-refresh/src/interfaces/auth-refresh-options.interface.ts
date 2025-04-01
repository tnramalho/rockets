import {
  IssueTokenServiceInterface,
  VerifyTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import { AuthRefreshUserLookupServiceInterface } from './auth-refresh-user-lookup-service.interface';
import { AuthRefreshSettingsInterface } from './auth-refresh-settings.interface';

export interface AuthRefreshOptionsInterface {
  /**
   * Implementation of a class that returns user identity
   */
  userLookupService: AuthRefreshUserLookupServiceInterface;

  /**
   * Implementation of a class to issue tokens
   */
  issueTokenService?: IssueTokenServiceInterface;

  /**
   * Implementation of a class to verify tokens
   */
  verifyTokenService?: VerifyTokenServiceInterface;

  /**
   * Settings
   */
  settings?: AuthRefreshSettingsInterface;
}
