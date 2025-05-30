import { InvitationInterface, LiteralObject } from '@concepta/nestjs-common';

export interface InvitationAcceptOptionsInterface
  extends Pick<InvitationInterface, 'code'> {
  passcode: string;
  payload?: LiteralObject;
}
