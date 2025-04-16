import { UserCreateDto } from '@concepta/nestjs-user';

/**
 * Rockets Server User Create DTO
 *
 * Extends the base user create DTO from the user module
 */
export class RocketsServerUserCreateDto extends UserCreateDto {
  /**
   * When extending the base DTO, you can add additional properties
   * specific to your application here
   */
}
