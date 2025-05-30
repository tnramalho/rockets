import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { InvitationEntityInterface } from '@concepta/nestjs-common';
import { TypeOrmCrudService } from '@concepta/nestjs-crud';

import { InvitationEntityFixture } from './invitation/entities/invitation.entity.fixture';

@Injectable()
export class InvitationCrudService extends TypeOrmCrudService<InvitationEntityInterface> {
  constructor(
    @InjectRepository(InvitationEntityFixture)
    invitationRepo: Repository<InvitationEntityInterface>,
  ) {
    super(invitationRepo);
  }
}
