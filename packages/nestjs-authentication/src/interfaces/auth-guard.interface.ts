import { Observable } from 'rxjs';

import { ExecutionContext } from '@nestjs/common';

// TODO: review why extending canActivate won't work
export interface AuthGuardInterface {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;
}
