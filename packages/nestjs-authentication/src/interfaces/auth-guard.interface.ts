import { CanActivate } from '@nestjs/common';

// TODO: review why extending canActivate won't work
export interface AuthGuardInterface extends CanActivate {}
