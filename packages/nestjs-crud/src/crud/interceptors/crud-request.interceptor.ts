import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PlainLiteralObject,
} from '@nestjs/common';

import { CRUD_MODULE_CRUD_REQUEST_KEY } from '../../crud.constants';
import { CrudRequestException } from '../../exceptions/crud-request.exception';
import { CrudRequestQueryParser } from '../../request/crud-request-query.parser';
import { CrudReflectionService } from '../../services/crud-reflection.service';
import { CrudOptionsInterface } from '../interfaces/crud-options.interface';
import { CrudRequestInterface } from '../interfaces/crud-request.interface';

@Injectable()
export class CrudRequestInterceptor<
  T extends PlainLiteralObject = PlainLiteralObject,
> implements NestInterceptor
{
  constructor(private reflectionService: CrudReflectionService<T>) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();

    try {
      if (!req[CRUD_MODULE_CRUD_REQUEST_KEY]) {
        const options = this.reflectionService.getRequestOptions(
          context.getClass(),
          context.getHandler(),
        );

        const parser = CrudRequestQueryParser.create();

        parser.parseQuery(req.query);

        // Parse route parameters if they exist and are configured
        if (req.params) {
          parser.parseParams(req.params, options.params ?? {});
        }

        req[CRUD_MODULE_CRUD_REQUEST_KEY] = this.getCrudRequest(
          parser,
          options,
        );
      }

      return next.handle();
    } catch (error) {
      throw new CrudRequestException({
        originalError: error,
      });
    }
  }

  getCrudRequest(
    parser: CrudRequestQueryParser<T>,
    crudOptions: Partial<CrudOptionsInterface<T>>,
  ): CrudRequestInterface<T> {
    const parsed = parser.getParsed();
    const { query, routes, params } = crudOptions;

    return {
      parsed,
      options: {
        query,
        routes,
        params,
      },
    };
  }
}
