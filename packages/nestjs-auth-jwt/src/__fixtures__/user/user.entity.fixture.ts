import { Entity } from 'typeorm';

import { ReferenceIdInterface } from '@concepta/nestjs-common';

@Entity()
export class UserFixture implements ReferenceIdInterface {
  id!: string;
}
