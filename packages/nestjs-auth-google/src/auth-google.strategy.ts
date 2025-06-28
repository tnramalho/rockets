import { Strategy } from 'passport-google-oauth20';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import {
  processOAuthParams,
  OAuthRequestInterface,
} from '@concepta/nestjs-authentication';
import {
  FederatedOAuthService,
  FederatedCredentialsInterface,
} from '@concepta/nestjs-federated';

import {
  AUTH_GOOGLE_MODULE_SETTINGS_TOKEN,
  AUTH_GOOGLE_STRATEGY_NAME,
} from './auth-google.constants';
import { AuthGoogleMissingEmailException } from './exceptions/auth-google-missing-email.exception';
import { AuthGoogleMissingIdException } from './exceptions/auth-google-missing-id.exception';
import { AuthGoogleProfileInterface } from './interfaces/auth-google-profile.interface';
import { AuthGoogleSettingsInterface } from './interfaces/auth-google-settings.interface';
import { mapProfile } from './utils/auth-google-map-profile';

@Injectable()
export class AuthGoogleStrategy extends PassportStrategy(
  Strategy,
  AUTH_GOOGLE_STRATEGY_NAME,
) {
  constructor(
    @Inject(AUTH_GOOGLE_MODULE_SETTINGS_TOKEN)
    private settings: AuthGoogleSettingsInterface,
    private federatedOAuthService: FederatedOAuthService,
  ) {
    super({
      clientID: settings?.clientID,
      clientSecret: settings?.clientSecret,
      callbackURL: settings?.callbackURL,
      scope: settings?.scope,
    });
  }
  /**
   * Handles OAuth authentication by overriding authentication options.
   * This allows dynamic configuration of:
   * - scope: Override the default scopes
   * - state: Pass state parameters for tracking auth flow
   * - callbackURL: Override the default callback URL
   *
   * @param req - OAuth request containing query parameters
   * @param options - Authentication options to override defaults
   */
  authenticate(
    req: OAuthRequestInterface,
    options: Record<string, unknown>,
  ): void {
    const authOptions = {
      ...options,
      ...processOAuthParams(req.query),
    };

    super.authenticate(req, authOptions);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: AuthGoogleProfileInterface,
  ): Promise<FederatedCredentialsInterface> {
    const googleProfile = this.settings.mapProfile
      ? this.settings.mapProfile(profile)
      : mapProfile(profile);

    if (!googleProfile?.id) {
      throw new AuthGoogleMissingIdException();
    }

    if (!googleProfile?.email) {
      throw new AuthGoogleMissingEmailException();
    }

    // Create a new user if it doesn't exist or just return based on federated
    const user = await this.federatedOAuthService.sign(
      AUTH_GOOGLE_STRATEGY_NAME,
      googleProfile.email,
      googleProfile.id,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
