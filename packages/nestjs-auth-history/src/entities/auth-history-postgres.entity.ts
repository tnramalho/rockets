import { Column } from 'typeorm';
import { CommonPostgresEntity } from '@concepta/typeorm-common';
import { ReferenceId, UserInterface } from '@concepta/nestjs-common';
import { AuthHistoryEntityInterface } from '../interfaces/auth-history-entity.interface';

/**
 * AuthHistory Entity
 */
export abstract class AuthHistoryPostgresEntity
  extends CommonPostgresEntity
  implements AuthHistoryEntityInterface
{
  /**
   * ipAddress
   */
  @Column({ type: 'text' })
  ipAddress!: string;

  /**
   * authType
   */
  @Column({ type: 'citext' })
  authType!: string;

  /**
   * deviceInfo
   */
  @Column({ type: 'citext', nullable: true, default: null })
  deviceInfo!: string | null;

  /**
   * Failure reason
   */
  @Column({ type: 'citext', nullable: true, default: null })
  failureReason!: string | null;

  /**
   * User ID
   */
  @Column({ type: 'uuid' })
  userId!: ReferenceId;

  /**
   * Should be configured by the implementation
   */
  user?: UserInterface;
}