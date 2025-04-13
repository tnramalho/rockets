import { RocketsServerOtpSettingsInterface } from './rockets-server-otp-settings.interface';
import { AuthenticationSettingsInterface } from '@concepta/nestjs-authentication/dist/interfaces/authentication-settings.interface';
import { JwtSettingsInterface } from '@concepta/nestjs-jwt/dist/interfaces/jwt-settings.interface';
import { AuthJwtSettingsInterface } from '@concepta/nestjs-auth-jwt/dist/interfaces/auth-jwt-settings.interface';
import { AuthRefreshSettingsInterface } from '@concepta/nestjs-auth-refresh/dist/interfaces/auth-refresh-settings.interface';

/**
 * Rockets Server settings interface
 */
export interface RocketsServerSettingsInterface {
  email: {
    from: string;
    baseUrl: string;
    tokenUrlFormatter?: (baseUrl: string, passcode: string) => string;
    templates: {
      sendOtp: {
        fileName: string;
        subject: string;
      };
    };
  };
  /**
   * OTP settings
   */
  otp: RocketsServerOtpSettingsInterface;

  /**
   * Authentication settings
   */
  authentication?: AuthenticationSettingsInterface;

  /**
   * JWT settings
   */
  jwt?: JwtSettingsInterface;

  /**
   * Auth JWT settings
   */
  authJwt?: Partial<AuthJwtSettingsInterface>;

  /**
   * Auth Refresh settings
   */
  refresh?: Partial<AuthRefreshSettingsInterface>;

  /**
   * Whether the module is global
   */
  global?: boolean;
}
