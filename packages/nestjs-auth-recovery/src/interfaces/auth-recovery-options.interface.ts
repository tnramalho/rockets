import { UserPasswordServiceInterface } from '@concepta/nestjs-user';

import { AuthRecoveryEmailServiceInterface } from './auth-recovery-email.service.interface';
import { AuthRecoveryNotificationServiceInterface } from './auth-recovery-notification.service.interface';
import { AuthRecoveryOtpServiceInterface } from './auth-recovery-otp.service.interface';
import { AuthRecoverySettingsInterface } from './auth-recovery-settings.interface';
import { AuthRecoveryUserModelServiceInterface } from './auth-recovery-user-model.service.interface';

export interface AuthRecoveryOptionsInterface {
  settings?: AuthRecoverySettingsInterface;
  otpService: AuthRecoveryOtpServiceInterface;
  emailService: AuthRecoveryEmailServiceInterface;
  userModelService: AuthRecoveryUserModelServiceInterface;
  userPasswordService: UserPasswordServiceInterface;
  notificationService?: AuthRecoveryNotificationServiceInterface;
}
