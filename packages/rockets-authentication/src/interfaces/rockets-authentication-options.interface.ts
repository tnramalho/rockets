import { AuthJwtOptionsInterface } from '@concepta/nestjs-auth-jwt/dist/interfaces/auth-jwt-options.interface';
import { AuthRefreshOptions } from '@concepta/nestjs-auth-refresh/dist/auth-refresh.module-definition';

import { ValidateTokenServiceInterface } from '@concepta/nestjs-authentication/dist/interfaces/validate-token-service.interface';

import {
  JwtIssueTokenServiceInterface,
  JwtServiceInterface,
  JwtVerifyTokenServiceInterface,
} from '@concepta/nestjs-jwt';
import { JwtOptions } from '@concepta/nestjs-jwt/dist/jwt.module-definition';
import { RocketsAuthUserLookupServiceInterface } from './rockets-auth-user-lookup-service.interface';
import {
  AuthenticationOptionsInterface,
  IssueTokenServiceInterface,
  VerifyTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import { AuthLocalOptionsInterface } from '@concepta/nestjs-auth-local/dist/interfaces/auth-local-options.interface';
import { AuthRecoveryOptionsInterface } from '@concepta/nestjs-auth-recovery/dist/interfaces/auth-recovery-options.interface';
import { RocketsOtpServiceInterface } from './rockets-otp-service.interface';
import { RocketsUserMutateServiceInterface } from './rockets-user-mutate-service.interface';
import { EmailSendInterface } from '@concepta/nestjs-common';
import { AuthVerifyOptionsInterface } from '@concepta/nestjs-auth-verify/dist/interfaces/auth-verify-options.interface';
import { AuthRecoveryNotificationServiceInterface } from '@concepta/nestjs-auth-recovery/dist/interfaces/auth-recovery-notification.service.interface';
import { RocketsNotificationServiceInterface } from './rockets-auth-notification.service.interface';

/**
 * Combined options interface for the AuthenticationCombinedModule
 */
export interface RocketsAuthenticationOptionsInterface {
  /**
   * Core Authentication module options
   * Used in: AuthenticationModule.forRootAsync
   */
  authentication?: AuthenticationOptionsInterface;

  /**
   * JWT module options
   * Used in: JwtModule.forRootAsync
   */
  jwt?: JwtOptions;

  /**
   * Auth JWT module options
   * Used in: AuthJwtModule.forRootAsync
   */
  authJwt?: AuthJwtOptionsInterface;
  
  /**
   * Auth Local module options
   * Used in: AuthLocalModule.forRootAsync
   */
  authLocal?: AuthLocalOptionsInterface;
  
  /**
   * Auth Recovery module options
   * Used in: AuthRecoveryModule.forRootAsync
   */
  authRecovery?: AuthRecoveryOptionsInterface;

  /**
   * Auth Refresh module options
   * Used in: AuthRefreshModule.forRootAsync
   */
  refresh?: AuthRefreshOptions;
  
  authVerify?: AuthVerifyOptionsInterface;

  /**
   * Core services used across different modules
   */
  services: {
    /**
     * Core user lookup service used across multiple modules
     * Used in: AuthJwtModule, AuthRefreshModule, AuthLocalModule, AuthRecoveryModule
     * Required: true
     */
    userLookupService: RocketsAuthUserLookupServiceInterface;

    /**
     * Email service for notifications
     * Used in: AuthRecoveryModule
     * Required: true
     */
    emailService: EmailSendInterface;

    /**
     * User mutation service for user operations
     * Used in: AuthRecoveryModule
     * Required: true
     */
    userMutateService: RocketsUserMutateServiceInterface;
    
    /**
     * Notification service for sending recovery notifications
     * Can be used to customize notification delivery
     * Used in: AuthRecoveryModule
     * Required: false
     */
    notificationService?: RocketsNotificationServiceInterface;
    
    /**
     * OTP service for verification flows
     * Used in: AuthRecoveryModule
     * Required: true
     */
    otpService: RocketsOtpServiceInterface;

    /**
     * Core authentication services used in AuthenticationModule
     * Required: true
     */
    verifyTokenService: VerifyTokenServiceInterface;
    issueTokenService: IssueTokenServiceInterface;
    validateTokenService: ValidateTokenServiceInterface;

    /**
     * JWT services used in JwtModule
     * Required: false
     */
    jwtService?: JwtServiceInterface;
    jwtAccessService?: JwtServiceInterface;
    jwtRefreshService?: JwtServiceInterface;
    jwtIssueTokenService?: JwtIssueTokenServiceInterface;
    jwtVerifyTokenService?: JwtVerifyTokenServiceInterface;
  };
}
