import { Type } from '@nestjs/common';

import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

export interface OAuthGuardConfigInterface {
  name: string;
  guard: Type<AuthGuardInterface>;
}
