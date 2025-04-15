import { RuntimeException } from '@concepta/nestjs-common';
import { CacheException } from './cache.exception';

export class CacheEntityNotFoundException extends CacheException {
  context: RuntimeException['context'] & {
    entityName: string;
  };

  constructor(
    entityName: string,
    message = 'Entity %s was not registered to be used.',
  ) {
    super({
      message,
      messageParams: [entityName],
    });

    this.errorCode = 'CACHE_ENTITY_NOT_FOUND_ERROR';

    this.context = {
      ...super.context,
      entityName,
    };
  }
}
