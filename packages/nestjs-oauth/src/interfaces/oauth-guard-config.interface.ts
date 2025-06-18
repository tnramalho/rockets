import { CanActivate, Type } from '@nestjs/common';

export interface OAuthGuardConfigInterface {
  name: string;
  guard: Type<CanActivate>;
}
