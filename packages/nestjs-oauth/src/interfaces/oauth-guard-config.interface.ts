import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';
import { Type } from '@nestjs/common';

export interface OAuthGuardConfigInterface {
  name: string;
  guard: Type<AuthGuardInterface>;
}
