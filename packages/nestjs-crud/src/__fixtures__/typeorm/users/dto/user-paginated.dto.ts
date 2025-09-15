import { Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { CrudResponsePaginatedDto } from '../../../../crud/dto/crud-response-paginated.dto';

import { UserDto } from './user.dto';

export class UserPaginatedDto extends CrudResponsePaginatedDto<UserDto> {
  @ApiProperty({
    type: UserDto,
    isArray: true,
  })
  @Type(() => UserDto)
  data!: UserDto[];
}
