import { CanActivate } from '@nestjs/common';

export type OAuthGuardsRecord = Record<string, CanActivate>;
