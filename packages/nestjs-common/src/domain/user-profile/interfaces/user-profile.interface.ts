import { AuditInterface } from '../../../audit/interfaces/audit.interface';
import { ReferenceIdInterface } from '../../../reference/interfaces/reference-id.interface';
import { UserOwnableInterface } from '../../user/interfaces/user-ownable.interface';

export interface UserProfileInterface
  extends ReferenceIdInterface,
    AuditInterface,
    UserOwnableInterface {}
