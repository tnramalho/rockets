import { Exclude, Expose, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { OrgCreatableInterface } from '@concepta/nestjs-common';
import { CrudCreateManyDto } from '@concepta/nestjs-crud';

import { OrgCreateDto } from './org-create.dto';

/**
 * Org DTO
 */
@Exclude()
export class OrgCreateManyDto extends CrudCreateManyDto<OrgCreatableInterface> {
  @Expose()
  @ApiProperty({
    type: OrgCreateDto,
    isArray: true,
    description: 'Array of Orgs to create',
  })
  @Type(() => OrgCreateDto)
  @IsArray()
  @ArrayNotEmpty()
  bulk: OrgCreateDto[] = [];
}
