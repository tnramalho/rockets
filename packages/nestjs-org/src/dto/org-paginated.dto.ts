import { Exclude, Expose, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { OrgInterface } from '@concepta/nestjs-common';
import { CrudResponsePaginatedDto } from '@concepta/nestjs-crud';

import { OrgDto } from './org.dto';

/**
 * Org paginated DTO
 */
@Exclude()
export class OrgPaginatedDto extends CrudResponsePaginatedDto<OrgInterface> {
  @Expose()
  @ApiProperty({
    type: OrgDto,
    isArray: true,
    description: 'Array of Orgs',
  })
  @Type(() => OrgDto)
  data: OrgDto[] = [];
}
