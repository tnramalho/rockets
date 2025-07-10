import { Type } from '@nestjs/common';

import { AuthGuardInterface } from '@concepta/nestjs-authentication/src';

export interface AuthGuardRouterGuardConfigInterface {
  name: string;
  guard: Type<AuthGuardInterface>;
}
