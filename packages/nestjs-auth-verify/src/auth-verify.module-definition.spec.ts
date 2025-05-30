import { mock } from 'jest-mock-extended';

import { FactoryProvider } from '@nestjs/common';

import {
  AUTH_VERIFY_MODULE_SETTINGS_TOKEN,
  AuthVerifyEmailService,
  AuthVerifyOtpService,
  AuthVerifyUserModelService,
} from './auth-verify.constants';
import {
  createAuthVerifyEmailServiceProvider,
  createAuthVerifyExports,
  createAuthVerifyNotificationServiceProvider,
  createAuthVerifyOtpServiceProvider,
  createAuthVerifyUserModelServiceProvider,
} from './auth-verify.module-definition';
import { AuthVerifyEmailServiceInterface } from './interfaces/auth-verify-email.service.interface';
import { AuthVerifyNotificationServiceInterface } from './interfaces/auth-verify-notification.service.interface';
import { AuthVerifyUserModelServiceInterface } from './interfaces/auth-verify-user-model.service.interface';
import { AuthVerifyNotificationService } from './services/auth-verify-notification.service';
import { AuthVerifyService } from './services/auth-verify.service';

import { OtpServiceFixture } from './__fixtures__/otp/otp.service.fixture';
import { UserModelServiceFixture } from './__fixtures__/user/services/user-model.service.fixture';

describe('AuthVerifyModuleDefinition', () => {
  const mockEmailService = mock<AuthVerifyEmailServiceInterface>();
  const mockAuthVerifyNotification =
    mock<AuthVerifyNotificationServiceInterface>();
  const mockAuthVerifyOptions = {
    emailService: mockEmailService,
    otpService: new OtpServiceFixture(),
    userModelService: new UserModelServiceFixture(),
  };
  describe(createAuthVerifyExports.name, () => {
    it('should return an array with the expected tokens', () => {
      const result = createAuthVerifyExports();
      expect(result).toEqual([
        AUTH_VERIFY_MODULE_SETTINGS_TOKEN,
        AuthVerifyOtpService,
        AuthVerifyEmailService,
        AuthVerifyUserModelService,
        AuthVerifyService,
      ]);
    });
  });

  describe(createAuthVerifyOtpServiceProvider.name, () => {
    class TestOtpService extends OtpServiceFixture {}

    const testOtpService = mock<TestOtpService>();

    it('should return a default otpService', async () => {
      const provider = createAuthVerifyOtpServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({});

      expect(useFactoryResult).toBe(undefined);
    });

    it('should return an otpService from initialization', async () => {
      const provider = createAuthVerifyOtpServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({
        otpService: testOtpService,
      });

      expect(useFactoryResult).toBe(testOtpService);
    });

    it('should return an overridden otpService', async () => {
      const provider = createAuthVerifyOtpServiceProvider({
        otpService: mockAuthVerifyOptions.otpService,
      }) as FactoryProvider;

      const useFactoryResult = await provider.useFactory({});

      expect(useFactoryResult).toBeInstanceOf(OtpServiceFixture);
    });
  });

  describe(createAuthVerifyEmailServiceProvider.name, () => {
    it('should return a have no default', async () => {
      const provider =
        createAuthVerifyEmailServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({});

      expect(useFactoryResult).toBe(undefined);
    });

    it('should override an emailService', async () => {
      const provider = createAuthVerifyEmailServiceProvider({
        emailService: mockAuthVerifyOptions.emailService,
      }) as FactoryProvider;

      const useFactoryResult = await provider.useFactory();

      expect(useFactoryResult).toBe(mockAuthVerifyOptions.emailService);
    });

    it('should return an emailService from initialization', async () => {
      const provider =
        createAuthVerifyEmailServiceProvider() as FactoryProvider;

      const testMockEmailService = mock<AuthVerifyEmailServiceInterface>();
      const useFactoryResult = await provider.useFactory({
        emailService: testMockEmailService,
      });

      expect(useFactoryResult).toBe(testMockEmailService);
    });
  });

  describe(createAuthVerifyUserModelServiceProvider.name, () => {
    it('should return a have no default', async () => {
      const provider =
        createAuthVerifyUserModelServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({});

      expect(useFactoryResult).toBe(undefined);
    });

    it('should override userModelService', async () => {
      const provider = createAuthVerifyUserModelServiceProvider({
        userModelService: mockAuthVerifyOptions.userModelService,
      }) as FactoryProvider;

      const useFactoryResult = await provider.useFactory();

      expect(useFactoryResult).toBe(mockAuthVerifyOptions.userModelService);
    });

    it('should return an userModelService from initialization', async () => {
      const provider =
        createAuthVerifyUserModelServiceProvider() as FactoryProvider;

      const mockService = mock<AuthVerifyUserModelServiceInterface>();
      const useFactoryResult = await provider.useFactory({
        userModelService: mockService,
      });

      expect(useFactoryResult).toBe(mockService);
    });
  });

  describe(createAuthVerifyNotificationServiceProvider.name, () => {
    it('should return a default AuthVerifyNotificationService', async () => {
      const provider =
        createAuthVerifyNotificationServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({});

      expect(useFactoryResult).toBeInstanceOf(AuthVerifyNotificationService);
    });

    it('should override notificationService', async () => {
      const provider = createAuthVerifyNotificationServiceProvider({
        notificationService: mockAuthVerifyNotification,
      }) as FactoryProvider;

      const useFactoryResult = await provider.useFactory();

      expect(useFactoryResult).toBe(mockAuthVerifyNotification);
    });

    it('should return an notificationService from initialization', async () => {
      const provider =
        createAuthVerifyNotificationServiceProvider() as FactoryProvider;

      const useFactoryResult = await provider.useFactory({
        notificationService: mockAuthVerifyNotification,
      });

      expect(useFactoryResult).toBe(mockAuthVerifyNotification);
    });
  });
});
