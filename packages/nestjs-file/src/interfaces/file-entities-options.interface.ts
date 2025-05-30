import {
  FileEntityInterface,
  RepositoryEntityOptionInterface,
} from '@concepta/nestjs-common';

import { FILE_MODULE_FILE_ENTITY_KEY } from '../file.constants';

export interface FileEntitiesOptionsInterface {
  [FILE_MODULE_FILE_ENTITY_KEY]: RepositoryEntityOptionInterface<FileEntityInterface>;
}
