import { Column, Entity, Unique } from 'typeorm';
import { ReportStatusEnum } from '@concepta/ts-common';
import { ReferenceIdInterface } from '@concepta/ts-core';
import { CommonPostgresEntity } from '@concepta/typeorm-common';
import { ReportEntityInterface } from '../interfaces/report-entity.interface';

/**
 * Report Postgres Entity
 */
@Entity()
@Unique(['serviceKey', 'name'])
export class ReportPostgresEntity
  extends CommonPostgresEntity
  implements ReportEntityInterface
{
  @Column()
  serviceKey!: string;

  @Column({ type: 'citext' })
  name!: string;

  @Column({
    type: 'enum',
    enum: ReportStatusEnum,
  })
  status!: ReportStatusEnum;

  @Column({ type: 'text', nullable: true, default: null })
  errorMessage: string | null = null;

  file!: ReferenceIdInterface;
}
