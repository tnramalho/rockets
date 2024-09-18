import { ReportInterface } from './report.interface';

export interface ReportCreatableInterface
  extends Pick<ReportInterface, 'serviceKey' | 'name' >,
    Partial<Pick<ReportInterface, 'status'>>{ }
