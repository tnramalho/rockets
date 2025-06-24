export { OAuthModule } from './oauth.module';

export { OAuthGuard, OAuthGuard as OAuthAuthGuard } from './oauth.guard';

export { OAuthGuardsRecord } from './oauth.types';

export { OAuthException } from './exceptions/oauth.exception';

// Export configuration types
export { OAuthOptions, OAuthAsyncOptions } from './oauth.module-definition';
// Export interfaces
export { OAuthOptionsInterface } from './interfaces/oauth-options.interface';
export { OAuthSettingsInterface } from './interfaces/oauth-settings.interface';
export { OAuthOptionsExtrasInterface } from './interfaces/oauth-options-extras.interface';
export { OAuthGuardConfigInterface } from './interfaces/oauth-guard-config.interface';
