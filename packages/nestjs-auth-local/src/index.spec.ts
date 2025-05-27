import {
  AuthLocalModule,
  AuthLocalLoginDto,
  AuthLocalGuard,
  LocalAuthGuard,
} from './index';

describe('Index', () => {
  it('AuthLocalModule should be imported', () => {
    expect(AuthLocalModule).toBeInstanceOf(Function);
  });

  it('AuthLocalLoginDto should be imported', () => {
    expect(AuthLocalLoginDto).toBeInstanceOf(Function);
  });

  it('AuthLocalGuard should be imported', () => {
    expect(AuthLocalGuard).toBeInstanceOf(Function);
  });

  it('LocalAuthGuard should be imported', () => {
    expect(LocalAuthGuard).toBeInstanceOf(Function);
  });
});
