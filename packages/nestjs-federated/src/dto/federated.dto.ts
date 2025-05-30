import { Exclude, Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import {
  ReferenceIdInterface,
  FederatedInterface,
  CommonEntityDto,
  ReferenceIdDto,
} from '@concepta/nestjs-common';

/**
 * Federated DTO
 */
@Exclude()
export class FederatedDto
  extends CommonEntityDto
  implements FederatedInterface
{
  /**
   * provider
   */
  @Expose()
  @ApiProperty({
    type: 'string',
    description: 'provider of the federated',
  })
  @IsString()
  provider = '';

  /**
   * subject
   */
  @Expose()
  @ApiProperty({
    type: 'string',
    description: 'subject of the federated',
  })
  @IsString()
  subject = '';

  /**
   * userId
   */
  @Expose()
  @ApiProperty({
    type: ReferenceIdDto,
    description: 'User data',
  })
  @Type(() => ReferenceIdDto)
  @ValidateNested()
  user: ReferenceIdInterface = new ReferenceIdDto();
}
