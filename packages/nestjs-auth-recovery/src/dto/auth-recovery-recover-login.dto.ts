import { IsEmail } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthRecoveryRecoverLoginDto {
  @ApiProperty({
    title: 'user email',
    type: 'string',
    description:
      'Recover email login by providing an email that will receive an username',
  })
  @IsEmail()
  email = '';
}
