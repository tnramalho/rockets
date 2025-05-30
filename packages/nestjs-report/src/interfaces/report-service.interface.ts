import { ReportInterface } from '@concepta/nestjs-common';

import { ReportCreateDto } from '../dto/report-create.dto';
import { DoneCallback } from '../report.types';

export interface ReportServiceInterface {
  generate(report: ReportCreateDto): Promise<ReportInterface>;
  fetch(report: Pick<ReportInterface, 'id'>): Promise<ReportInterface>;
  done: DoneCallback;
}
