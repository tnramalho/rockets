import {
  FileCreatableInterface,
  FileInterface,
  ReferenceIdInterface,
} from '@concepta/nestjs-common';

export interface FileServiceInterface {
  push(file: FileCreatableInterface): Promise<FileInterface>;
  fetch(file: ReferenceIdInterface): Promise<FileInterface>;
}
