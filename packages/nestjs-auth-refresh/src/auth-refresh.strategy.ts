import { Inject, Injectable } from '@nestjs/common';
import {
  PassportStrategyFactory,
  VerifyTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import {
  createVerifyRefreshTokenCallback,
  JwtStrategy,
} from '@concepta/nestjs-jwt';
import { AuthorizationPayloadInterface } from '@concepta/ts-common';
import { QueryOptionsInterface } from '@concepta/typeorm-common';

import {
  AUTH_REFRESH_MODULE_STRATEGY_NAME,
  AUTH_REFRESH_MODULE_USER_LOOKUP_SERVICE_TOKEN,
  AUTH_REFRESH_MODULE_VERIFY_SERVICE_TOKEN,
  AUTH_REFRESH_MODULE_SETTINGS_TOKEN,
} from './auth-refresh.constants';

import { AuthRefreshSettingsInterface } from './interfaces/auth-refresh-settings.interface';
import { AuthRefreshUserLookupServiceInterface } from './interfaces/auth-refresh-user-lookup-service.interface';
import { AuthRefreshUnauthorizedException } from './exceptions/auth-refresh-unauthorized.exception';

@Injectable()
export class AuthRefreshStrategy extends PassportStrategyFactory<JwtStrategy>(
  JwtStrategy,
  AUTH_REFRESH_MODULE_STRATEGY_NAME,
) {
  constructor(
    @Inject(AUTH_REFRESH_MODULE_SETTINGS_TOKEN)
    settings: Partial<AuthRefreshSettingsInterface>,
    @Inject(AUTH_REFRESH_MODULE_VERIFY_SERVICE_TOKEN)
    verifyTokenService: VerifyTokenServiceInterface,
    @Inject(AUTH_REFRESH_MODULE_USER_LOOKUP_SERVICE_TOKEN)
    private userLookupService: AuthRefreshUserLookupServiceInterface,
  ) {
    const options: Partial<AuthRefreshSettingsInterface> = {
      verifyToken: createVerifyRefreshTokenCallback(verifyTokenService),
      ...settings,
    };

    super(options);
  }

  /**
   * Validate the user sub from the verified token
   *
   * @param payload - Authorization payload
   */
  async validate(
    payload: AuthorizationPayloadInterface,
    queryOptions?: QueryOptionsInterface,
  ) {
    const user = await this.userLookupService.bySubject(
      payload.sub,
      queryOptions,
    );

    if (!user) {
      throw new AuthRefreshUnauthorizedException();
    }

    return user;
  }
}
