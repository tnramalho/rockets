import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReferenceIdInterface } from '@concepta/ts-core';
import { IsString } from 'class-validator';

@Exclude()
export class ReferenceIdDto implements ReferenceIdInterface {
  @Expose()
  @ApiProperty({
    type: 'string',
    description: 'Unique identifier',
  })
  @IsString()
  id = '';
}
