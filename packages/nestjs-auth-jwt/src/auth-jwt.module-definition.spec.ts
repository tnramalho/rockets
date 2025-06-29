import { mock } from 'jest-mock-extended';

import { FactoryProvider, CanActivate } from '@nestjs/common';

import { AuthJwtGuard } from './auth-jwt.guard';
import {
  AuthJwtOptions,
  createAuthJwtAppGuardProvider,
} from './auth-jwt.module-definition';

describe(createAuthJwtAppGuardProvider.name, () => {
  const guard = mock<AuthJwtGuard>() as CanActivate;

  it('should return null if appGuard is explicitly false', async () => {
    const options: Pick<AuthJwtOptions, 'appGuard'> = { appGuard: false };
    const provider = createAuthJwtAppGuardProvider(options) as FactoryProvider;
    const result = await provider.useFactory(options, guard);
    expect(result).toBeNull();
  });

  it('should return appGuard if set, or fall back to default', async () => {
    const options = { appGuard: guard };
    const provider = createAuthJwtAppGuardProvider(options) as FactoryProvider;
    const result = await provider.useFactory(options, guard);
    expect(result).toBe(options.appGuard);
  });
});
