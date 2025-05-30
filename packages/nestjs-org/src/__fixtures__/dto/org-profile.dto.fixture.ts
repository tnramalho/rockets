import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { OrgProfileDto } from '../../dto/profile/org-profile.dto';

export class OrgProfileDtoFixture extends OrgProfileDto {
  @Expose()
  @ApiProperty()
  @IsString()
  name!: string;
}
