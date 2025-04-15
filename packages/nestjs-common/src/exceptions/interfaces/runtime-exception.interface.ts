import { HttpStatus } from '@nestjs/common';
import { ExceptionInterface } from '../interfaces/exception.interface';
import { RuntimeExceptionContext } from '../exception.types';

export interface RuntimeExceptionInterface extends ExceptionInterface {
  /**
   * Optional HTTP status code to use only when this exception is sent over an HTTP service.
   *
   * Please consider this to be a hint for API error responses.
   */
  httpStatus?: HttpStatus;

  /**
   * If set, this message will be used on responses instead of `message`.
   *
   * Use this when the main message might expose
   */
  safeMessage?: string;

  /**
   * Additional context
   */
  context: RuntimeExceptionContext;
}
