import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeOrmCrudService } from '../../../services/typeorm-crud.service';

import { NoteEntity } from './note.entity';

@Injectable()
export class NoteService extends TypeOrmCrudService<NoteEntity> {
  constructor(@InjectRepository(NoteEntity) repo: Repository<NoteEntity>) {
    super(repo);
  }
}
