import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EmailService } from '@concepta/nestjs-email';

import { AUTH_VERIFY_MODULE_EMAIL_SERVICE_TOKEN } from '../auth-verify.constants';
import { AuthVerifyNotificationService } from './auth-verify-notification.service';

import { AppModuleFixture } from '../__fixtures__/app.module.fixture';

describe('AuthVerifyNotificationService', () => {
  let app: INestApplication;
  let emailService: EmailService;
  let authVerifyNotificationService: AuthVerifyNotificationService;

  let spyEmailService: jest.SpyInstance;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleFixture],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    emailService = moduleFixture.get<EmailService>(
      AUTH_VERIFY_MODULE_EMAIL_SERVICE_TOKEN,
    );

    spyEmailService = jest
      .spyOn(emailService, 'sendMail')
      .mockResolvedValue(undefined);

    authVerifyNotificationService =
      moduleFixture.get<AuthVerifyNotificationService>(
        AuthVerifyNotificationService,
      );
  });

  afterEach(async () => {
    jest.clearAllMocks();
    return app ? await app.close() : undefined;
  });

  it('Send email', async () => {
    await authVerifyNotificationService.sendEmail({});
    expect(spyEmailService).toHaveBeenCalledTimes(1);
  });

  it('Send verify email password', async () => {
    await authVerifyNotificationService.sendVerifyEmail({
      email: 'me@mail.com',
      passcode: 'me',
      resetTokenExp: new Date(),
    });
    expect(spyEmailService).toHaveBeenCalledTimes(1);
  });

  it('Send verify email password', async () => {
    authVerifyNotificationService['settings'].email.tokenUrlFormatter =
      undefined;

    await authVerifyNotificationService.sendVerifyEmail({
      email: 'me@mail.com',
      passcode: 'me',
      resetTokenExp: new Date(),
    });
    expect(spyEmailService).toHaveBeenCalledTimes(1);
  });
});
