import { Injectable } from '@nestjs/common';

import {
  FileCreatableInterface,
  FileInterface,
  FileUpdatableInterface,
  ModelService,
  RepositoryInterface,
  InjectDynamicRepository,
  FileEntityInterface,
} from '@concepta/nestjs-common';

import { FileCreateDto } from '../dto/file-create.dto';
import { FileUpdateDto } from '../dto/file-update.dto';
import { FilenameMissingException } from '../exceptions/file-name-missing.exception';
import { FileServiceKeyMissingException } from '../exceptions/file-service-key-missing.exception';
import { FILE_MODULE_FILE_ENTITY_KEY } from '../file.constants';
import { FileModelServiceInterface } from '../interfaces/file-model-service.interface';

/**
 * File model service
 */
@Injectable()
export class FileModelService
  extends ModelService<
    FileEntityInterface,
    FileCreatableInterface,
    FileUpdatableInterface
  >
  implements FileModelServiceInterface
{
  protected createDto = FileCreateDto;
  protected updateDto = FileUpdateDto;

  /**
   * Constructor
   *
   * @param repo - instance of the file repo
   */
  constructor(
    @InjectDynamicRepository(FILE_MODULE_FILE_ENTITY_KEY)
    repo: RepositoryInterface<FileEntityInterface>,
  ) {
    super(repo);
  }

  async getUniqueFile(file: Pick<FileInterface, 'serviceKey' | 'fileName'>) {
    if (!file.serviceKey) {
      throw new FileServiceKeyMissingException();
    }
    if (!file.fileName) {
      throw new FilenameMissingException();
    }
    return this.repo.findOne({
      where: {
        serviceKey: file.serviceKey,
        fileName: file.fileName,
      },
    });
  }
}
