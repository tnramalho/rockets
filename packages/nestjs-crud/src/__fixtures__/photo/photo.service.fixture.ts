import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeOrmCrudService } from '../../services/typeorm-crud.service';

import { PhotoFixture } from './photo.entity.fixture';

/**
 * Photo CRUD service
 */
@Injectable()
export class PhotoServiceFixture extends TypeOrmCrudService<PhotoFixture> {
  constructor(
    @InjectRepository(PhotoFixture)
    photoRepo: Repository<PhotoFixture>,
  ) {
    super(photoRepo);
  }
}
