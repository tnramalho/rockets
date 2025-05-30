import { IsEmail } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthRecoveryRecoverPasswordDto {
  @ApiProperty({
    title: 'user email',
    type: 'string',
    description:
      'Recover email password by providing an email that will receive a password reset link',
  })
  @IsEmail()
  email = '';
}
