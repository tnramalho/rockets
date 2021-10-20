import { Test, TestingModule } from '@nestjs/testing';
import { PasswordStrengthService } from '..';
import { AUTHENTICATION_MODULE_CONFIG } from '../config/authentication.config';
import { PasswordStrengthEnum } from '../enum/password-strength.enum';
import { AuthenticationConfigOptionsInterface } from '../interface/authentication-config-options.interface';
import { PasswordStorageService } from './password-storage.service';

describe('PasswordStorageService', () => {
  let service: PasswordStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AUTHENTICATION_MODULE_CONFIG,
          useValue: {
            minPasswordStrength: PasswordStrengthEnum.Strong
          }
        },
        PasswordStorageService,
        {
          provide: PasswordStrengthService,
          useValue: {
            isStrong: (password: string) => {},
          }
        },
      ],
    }).compile();

    service = module.get<PasswordStorageService>(PasswordStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
