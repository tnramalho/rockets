import {
  RuntimeException,
  RuntimeExceptionOptions,
} from '@concepta/nestjs-common';
/**
 * Generic auth guard router exception.
 */
export class AuthGuardRouterException extends RuntimeException {
  constructor(options?: RuntimeExceptionOptions) {
    super(options);
    this.errorCode = 'AUTH_GUARD_ROUTER_ERROR';
  }
}
