import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeOrmCrudService } from '../../../services/typeorm-crud.service';

import { ProjectEntity } from './project.entity';

@Injectable()
export class ProjectService extends TypeOrmCrudService<ProjectEntity> {
  constructor(
    @InjectRepository(ProjectEntity) repo: Repository<ProjectEntity>,
  ) {
    super(repo);
  }
}
