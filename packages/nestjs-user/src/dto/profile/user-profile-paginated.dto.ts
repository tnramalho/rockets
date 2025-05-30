import { Exclude, Expose, Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { UserProfileInterface } from '@concepta/nestjs-common';
import { CrudResponsePaginatedDto } from '@concepta/nestjs-crud';

import { UserProfileDto } from './user-profile.dto';

/**
 * User Profile paginated DTO
 */
@Exclude()
export class UserProfilePaginatedDto extends CrudResponsePaginatedDto<UserProfileInterface> {
  @Expose()
  @ApiProperty({
    type: UserProfileDto,
    isArray: true,
    description: 'Array of User Profiles',
  })
  @Type(() => UserProfileDto)
  data: UserProfileDto[] = [];
}
