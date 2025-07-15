import { CanActivate, Type } from '@nestjs/common';

export interface AuthGuardRouterGuardConfigInterface {
  name: string;
  guard: Type<CanActivate>;
}
