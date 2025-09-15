import { Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { CrudResponsePaginatedDto } from '../../../../crud/dto/crud-response-paginated.dto';

import { ProjectDto } from './project.dto';

export class ProjectPaginatedDto extends CrudResponsePaginatedDto<ProjectDto> {
  @ApiProperty({
    type: ProjectDto,
    isArray: true,
  })
  @Type(() => ProjectDto)
  data!: ProjectDto[];
}
