import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TypeOrmCrudService } from '../../../services/typeorm-crud.service';

import { DeviceEntity } from './device.entity';

@Injectable()
export class DeviceService extends TypeOrmCrudService<DeviceEntity> {
  constructor(@InjectRepository(DeviceEntity) repo: Repository<DeviceEntity>) {
    super(repo);
  }
}
