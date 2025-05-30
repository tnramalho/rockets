import { IsEmail } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthVerifyDto {
  @ApiProperty({
    title: 'user email',
    type: 'string',
    description:
      'Verify email by providing an email that will receive a confirmation link',
  })
  @IsEmail()
  email = '';
}
