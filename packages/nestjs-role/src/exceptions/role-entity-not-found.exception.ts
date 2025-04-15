import {
  RuntimeException,
  RuntimeExceptionOptions,
} from '@concepta/nestjs-common';
import { RoleException } from './role.exception';

export class RoleEntityNotFoundException extends RoleException {
  context: RuntimeException['context'] & { entityName: string };

  constructor(entityName: string, options?: RuntimeExceptionOptions) {
    super({
      message: 'Entity %s was not registered to be used.',
      messageParams: [entityName],
      ...options,
    });

    this.errorCode = 'ROLE_ENTITY_NOT_FOUND_ERROR';

    this.context = {
      ...super.context,
      entityName,
    };
  }
}
