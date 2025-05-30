import { AuthGithubCredentialsInterface } from './interfaces/auth-github-credentials.interface';
import { AuthGithubProfileInterface } from './interfaces/auth-github-profile.interface';

export type MapProfile = (
  profile: AuthGithubProfileInterface,
) => AuthGithubCredentialsInterface;
