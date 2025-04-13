import { Injectable, Inject } from '@nestjs/common';
import { EmailSendInterface } from '@concepta/nestjs-common';
import { EmailService } from '@concepta/nestjs-email';
import { RocketsServerSettingsInterface } from '../interfaces/rockets-server-settings.interface';
import { ROCKETS_SERVER_MODULE_OPTIONS_DEFAULT_SETTINGS_TOKEN } from '../rockets-server.constants';
import { RocketsServerOtpNotificationServiceInterface } from '../interfaces/rockets-server-otp-notification-service.interface';

export interface RocketsServerOtpEmailParams {
  email: string;
  passcode: string;
}

@Injectable()
export class RocketsServerNotificationService
  implements RocketsServerOtpNotificationServiceInterface
{
  constructor(
    @Inject(ROCKETS_SERVER_MODULE_OPTIONS_DEFAULT_SETTINGS_TOKEN)
    private readonly settings: RocketsServerSettingsInterface,
    @Inject(EmailService)
    private readonly emailService: EmailSendInterface,
  ) {}

  async sendOtpEmail(params: RocketsServerOtpEmailParams): Promise<void> {
    const { email, passcode } = params;
    const { fileName, subject } = this.settings.email.templates.sendOtp;
    const { from, baseUrl } = this.settings.email;

    await this.emailService.sendMail({
      to: email,
      from,
      subject,
      template: fileName,
      context: {
        passcode,
        tokenUrl: `${baseUrl}/${passcode}`,
      },
    });
  }
}
