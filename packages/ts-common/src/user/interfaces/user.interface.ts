import {
  AuditInterface,
  ReferenceActiveInterface,
  ReferenceEmailInterface,
  ReferenceIdInterface,
  ReferenceUsernameInterface,
  ReferenceLastLoginInterface,
} from '@concepta/ts-core';

export interface UserInterface
  extends ReferenceIdInterface,
    ReferenceEmailInterface,
    ReferenceUsernameInterface,
    ReferenceActiveInterface,
    ReferenceLastLoginInterface,
    AuditInterface {}
