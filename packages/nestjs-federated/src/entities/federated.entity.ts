import { AuditInterface } from '@concepta/ts-core';
import { AuditPostgresEmbed } from '@concepta/typeorm-common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FederatedEntityInterface } from '../interfaces/federated-entity.interface';

/**
 * Federated Entity
 */
@Entity()
export class FederatedEntity implements FederatedEntityInterface {
  /**
   * Unique Id
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * provider
   */
  @Column()
  provider: string;

  /**
   * subject
   */
  @Column()
  subject: string;

  /**
   * userId
   */
  @Column()
  userId: string;

  /**
   * Audit embed
   */
  @Column(() => AuditPostgresEmbed)
  audit: AuditInterface;
}
