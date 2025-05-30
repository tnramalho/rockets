import { Exclude, Expose, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { OrgProfileInterface } from '@concepta/nestjs-common';
import { CrudResponsePaginatedDto } from '@concepta/nestjs-crud';

import { OrgProfileDto } from './org-profile.dto';

/**
 * Org Profile paginated DTO
 */
@Exclude()
export class OrgProfilePaginatedDto extends CrudResponsePaginatedDto<OrgProfileInterface> {
  @Expose()
  @ApiProperty({
    type: OrgProfileDto,
    isArray: true,
    description: 'Array of Org Profiles',
  })
  @Type(() => OrgProfileDto)
  data: OrgProfileDto[] = [];
}
