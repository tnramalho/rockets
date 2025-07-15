import { CanActivate } from '@nestjs/common';

export type AuthGuardRouterGuardsRecord = Record<string, CanActivate>;
