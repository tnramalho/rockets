import { mock } from 'jest-mock-extended';

import { AuthVerifyUpdateDto } from '../dto/auth-verify-update.dto';
import { AuthVerifyDto } from '../dto/auth-verify.dto';
import { AuthVerifyService } from '../services/auth-verify.service';

import { AuthVerifyControllerFixture } from '../__fixtures__/auth-verify.controller.fixture';

describe(AuthVerifyControllerFixture.name, () => {
  let controller: AuthVerifyControllerFixture;
  let authVerifyService: AuthVerifyService;
  const dto: AuthVerifyDto = {
    email: 'test@example.com',
  };
  const authVerifyUpdateDto: AuthVerifyUpdateDto = {
    passcode: '123456',
  };
  beforeEach(() => {
    authVerifyService = mock<AuthVerifyService>();
    controller = new AuthVerifyControllerFixture(authVerifyService);
  });

  describe('send', () => {
    it('should call send method of AuthVerifyService', async () => {
      const verifySendSpy = jest.spyOn(authVerifyService, 'send');

      await controller.send(dto);

      expect(verifySendSpy).toHaveBeenCalledWith({ email: dto.email });
    });
  });

  describe('confirm', () => {
    it('should call confirmUser method of AuthVerifyService', async () => {
      const confirmUserSpy = jest
        .spyOn(authVerifyService, 'confirmUser')
        .mockResolvedValue(null);

      await controller.confirm(authVerifyUpdateDto);

      expect(confirmUserSpy).toHaveBeenCalledWith({
        passcode: authVerifyUpdateDto.passcode,
      });
    });

    it('should call confirmUser method of AuthVerifyService', async () => {
      const confirmUserSpy = jest
        .spyOn(authVerifyService, 'confirmUser')
        .mockResolvedValue({
          id: '1',
        });

      await controller.confirm(authVerifyUpdateDto);

      expect(confirmUserSpy).toHaveBeenCalledWith({
        passcode: authVerifyUpdateDto.passcode,
      });
    });
  });
});
