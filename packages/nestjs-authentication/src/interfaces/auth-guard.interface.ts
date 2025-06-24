import { ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

//TODO: review why extending canActivate won't work
export interface AuthGuardInterface   {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}
