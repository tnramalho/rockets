import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AuthRecoveryValidatePasscodeDto {
  @ApiProperty({
    title: 'User passcode',
    type: 'string',
    description: 'User passcode used to verify if it valid or not.',
  })
  @IsString()
  passcode = '';
}
