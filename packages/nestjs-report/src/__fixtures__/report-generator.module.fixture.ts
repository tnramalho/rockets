import { Global, Module } from '@nestjs/common';

import { MyReportGeneratorShortDelayService } from './my-report-generator-short-delay.service';
import { MyReportGeneratorService } from './my-report-generator.service';

@Global()
@Module({
  providers: [MyReportGeneratorService, MyReportGeneratorShortDelayService],
  exports: [MyReportGeneratorService, MyReportGeneratorShortDelayService],
})
export class ReportGeneratorModuleFixture {}
