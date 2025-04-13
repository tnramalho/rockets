import { ReferenceIdInterface } from '@concepta/nestjs-common';
import { OtpException, OtpService } from '@concepta/nestjs-otp';
import { Inject, Injectable } from '@nestjs/common';
import { RocketsServerUserLookupServiceInterface } from '../interfaces/rockets-server-user-lookup-service.interface';
import {
  ROCKETS_SERVER_MODULE_OPTIONS_DEFAULT_SETTINGS_TOKEN,
  RocketsServerUserLookupService,
} from '../rockets-server.constants';

import { RocketsServerOtpNotificationServiceInterface } from '../interfaces/rockets-server-otp-notification-service.interface';
import { RocketsServerOtpServiceInterface } from '../interfaces/rockets-server-otp-service.interface';
import { RocketsServerSettingsInterface } from '../interfaces/rockets-server-settings.interface';
import { RocketsServerNotificationService } from './rockets-server-notification.service';

@Injectable()
export class RocketsServerOtpService
  implements RocketsServerOtpServiceInterface
{
  constructor(
    @Inject(ROCKETS_SERVER_MODULE_OPTIONS_DEFAULT_SETTINGS_TOKEN)
    private readonly settings: RocketsServerSettingsInterface,
    @Inject(RocketsServerUserLookupService)
    private readonly userLookupService: RocketsServerUserLookupServiceInterface,
    private readonly otpService: OtpService,
    @Inject(RocketsServerNotificationService)
    private readonly otpNotificationService: RocketsServerOtpNotificationServiceInterface,
  ) {}

  async sendOtp(email: string): Promise<void> {
    // Find user by email
    const user = await this.userLookupService.byEmail(email);
    const { assignment, category, expiresIn } = this.settings.otp;
    if (user) {
      // Generate OTP
      const otp = await this.otpService.create({
        assignment,
        otp: {
          category,
          type: 'uuid',
          assignee: { id: user.id },
          expiresIn: expiresIn, // 1 hour expiration
        },
      });

      // Send email with OTP
      await this.otpNotificationService.sendOtpEmail({
        email,
        passcode: otp.passcode,
      });
    }
    // Always return void for security (don't reveal if user exists)
  }

  async confirmOtp(
    email: string,
    passcode: string,
  ): Promise<ReferenceIdInterface> {
    const { assignment, category } = this.settings.otp;
    // Find user by email
    const user = await this.userLookupService.byEmail(email);

    if (!user) {
      throw new OtpException();
    }

    // Validate OTP
    const isValid = await this.otpService.validate(
      assignment,
      {
        category: category,
        passcode,
      },
      true,
    );

    if (!isValid) {
      throw new OtpException();
    }

    return user;
  }
}
