import { randomUUID } from 'crypto';

import { mock } from 'jest-mock-extended';

import { IssueTokenServiceInterface } from '@concepta/nestjs-authentication';
import {
  AuthenticatedUserInterface,
  AuthenticationResponseInterface,
} from '@concepta/nestjs-common';

import { AuthRefreshControllerFixture } from './__fixtures__/auth-refresh.controller.fixture';

describe(AuthRefreshControllerFixture, () => {
  const accessToken = 'accessToken';
  const refreshToken = 'refreshToken';
  let controller: AuthRefreshControllerFixture;
  const response: AuthenticationResponseInterface = {
    accessToken,
    refreshToken,
  };

  beforeEach(async () => {
    const issueTokenService = mock<IssueTokenServiceInterface>({
      responsePayload: () => {
        return new Promise((resolve) => {
          resolve(response);
        });
      },
    });
    controller = new AuthRefreshControllerFixture(issueTokenService);
  });

  describe(AuthRefreshControllerFixture.prototype.refresh, () => {
    it('should return user', async () => {
      const user: AuthenticatedUserInterface = {
        id: randomUUID(),
      };
      const result = await controller.refresh(user);
      expect(result.accessToken).toBe(response.accessToken);
    });
  });
});
