import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthVerifyUpdateDto {
  @ApiProperty({
    title: 'account confirm passcode',
    type: 'string',
    description: 'Passcode used to confirm account',
  })
  @IsString()
  passcode = '';
}
