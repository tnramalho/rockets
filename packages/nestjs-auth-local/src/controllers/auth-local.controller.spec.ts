import { IssueTokenServiceInterface } from '@concepta/nestjs-authentication';
import {
  AuthenticatedUserInterface,
  AuthenticationResponseInterface,
} from '@concepta/nestjs-common';
import { randomUUID } from 'crypto';
import { mock } from 'jest-mock-extended';
import { AuthLocalControllerFixture } from '../__fixtures__/auth-local.controller.fixture';

describe(AuthLocalControllerFixture, () => {
  const accessToken = 'accessToken';
  const refreshToken = 'refreshToken';
  let controller: AuthLocalControllerFixture;
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
    controller = new AuthLocalControllerFixture(issueTokenService);
  });

  describe(AuthLocalControllerFixture.prototype.login, () => {
    it('should return user', async () => {
      const user: AuthenticatedUserInterface = {
        id: randomUUID(),
      };
      const result = await controller.login(user);
      expect(result.accessToken).toBe(response.accessToken);
    });
  });
});
