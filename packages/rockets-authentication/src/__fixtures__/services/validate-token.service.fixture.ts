import { ValidateTokenServiceInterface } from '@concepta/nestjs-authentication/dist/interfaces/validate-token-service.interface';

export class ValidateTokenServiceFixture
  implements ValidateTokenServiceInterface
{
  public discriminator = 'default';

  async validateToken(_payload: object): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
