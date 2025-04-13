import { Entity } from 'typeorm';
import { UserPasswordHistorySqliteEntity } from '@concepta/nestjs-user/dist/entities/user-password-history-sqlite.entity';

@Entity()
export class UserPasswordHistoryEntityFixture extends UserPasswordHistorySqliteEntity {}
