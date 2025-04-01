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

/**
 * Combined options interface for the AuthenticationCombinedModule
 */
export interface RocketsAuthenticationOptionsInterface {
  /**
   * Core Authentication module options
   */
  authentication?: AuthenticationOptionsInterface;

  /**
   * JWT module options
   */
  jwt?: JwtOptions;

  /**
   * Auth JWT module options
   */
  authJwt?: AuthJwtOptionsInterface;

  /**
   * Auth Refresh module options
   */
  refresh?: AuthRefreshOptions;

  services: {
    jwtService?: JwtServiceInterface;
    jwtAccessService?: JwtServiceInterface;
    jwtRefreshService?: JwtServiceInterface;
    jwtIssueTokenService?: JwtIssueTokenServiceInterface;
    jwtVerifyTokenService?: JwtVerifyTokenServiceInterface;

    userLookupService: RocketsAuthUserLookupServiceInterface;
    issueTokenService?: IssueTokenServiceInterface;
    verifyTokenService?: VerifyTokenServiceInterface;
    validateTokenService?: ValidateTokenServiceInterface;
  };
}
