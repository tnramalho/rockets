import { Exclude } from 'class-transformer';

import { PickType } from '@nestjs/swagger';

import { ReportCreatableInterface } from '@concepta/nestjs-common';

import { ReportDto } from './report.dto';

/**
 * Report Create DTO
 */
@Exclude()
export class ReportCreateDto
  extends PickType(ReportDto, ['serviceKey', 'name', 'status'] as const)
  implements ReportCreatableInterface {}
