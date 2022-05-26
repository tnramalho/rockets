import { OptionsInterface } from '@concepta/ts-core';
import { PasswordStrengthEnum } from '../enum/password-strength.enum';

/**
 * Password module settings interface
 */
export interface PasswordSettingsInterface extends OptionsInterface {
  /**
   * Min level of password strength allowed
   */
  minPasswordStrength?: PasswordStrengthEnum;

  /**
   * Max number of password attempts allowed
   */
  maxPasswordAttempts?: number;
}