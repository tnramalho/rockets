import { AuthRecoveryUpdatePasswordDto } from '@concepta/nestjs-auth-recovery';

/**
 * Rockets Server Update Password DTO
 *
 * Extends the base recovery update password DTO from the auth-recovery module
 */
export class RocketsServerUpdatePasswordDto extends AuthRecoveryUpdatePasswordDto {
  /**
   * When extending the base DTO, you can add additional properties
   * specific to your application here
   */
}
