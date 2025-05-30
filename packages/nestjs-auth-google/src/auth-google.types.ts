import { AuthGoogleCredentialsInterface } from './interfaces/auth-google-credentials.interface';
import { AuthGoogleProfileInterface } from './interfaces/auth-google-profile.interface';

export type MapProfile = (
  profile: AuthGoogleProfileInterface,
) => AuthGoogleCredentialsInterface;
