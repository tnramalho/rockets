import { Exclude } from 'class-transformer';

import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';

import { ReportUpdatableInterface } from '@concepta/nestjs-common';

import { ReportDto } from './report.dto';

/**
 * Report Update DTO
 */
@Exclude()
export class ReportUpdateDto
  extends IntersectionType(
    PickType(ReportDto, ['id', 'status'] as const),
    PartialType(PickType(ReportDto, ['errorMessage', 'fileId'] as const)),
  )
  implements ReportUpdatableInterface {}
