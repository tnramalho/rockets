import { ReferenceIdInterface } from '@concepta/nestjs-common';

export interface RocketsServerOtpServiceInterface {
  sendOtp(email: string): Promise<void>;

  confirmOtp(email: string, passcode: string): Promise<ReferenceIdInterface>;
}
