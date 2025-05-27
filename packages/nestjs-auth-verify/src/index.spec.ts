import {
  AuthVerifyModule,
  AuthVerifyService,
  AuthVerifyNotificationService,
  AuthVerifyDto,
} from './index';

describe('Index', () => {
  it('AuthVerifyModule should be a function', () => {
    expect(AuthVerifyModule).toBeInstanceOf(Function);
  });

  it('AuthVerifyService should be a function', () => {
    expect(AuthVerifyService).toBeInstanceOf(Function);
  });

  it('AuthVerifyNotificationService should be a function', () => {
    expect(AuthVerifyNotificationService).toBeInstanceOf(Function);
  });

  it('AuthVerifyVerifyLoginDto should be a function', () => {
    expect(AuthVerifyDto).toBeInstanceOf(Function);
  });
});
