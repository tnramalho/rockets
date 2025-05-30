import { AuthVerifyEmailServiceInterface } from './auth-verify-email.service.interface';
import { AuthVerifyNotificationServiceInterface } from './auth-verify-notification.service.interface';
import { AuthVerifyOtpServiceInterface } from './auth-verify-otp.service.interface';
import { AuthVerifySettingsInterface } from './auth-verify-settings.interface';
import { AuthVerifyUserModelServiceInterface } from './auth-verify-user-model.service.interface';

export interface AuthVerifyOptionsInterface {
  settings?: AuthVerifySettingsInterface;
  otpService: AuthVerifyOtpServiceInterface;
  emailService: AuthVerifyEmailServiceInterface;
  userModelService: AuthVerifyUserModelServiceInterface;
  notificationService?: AuthVerifyNotificationServiceInterface;
}
