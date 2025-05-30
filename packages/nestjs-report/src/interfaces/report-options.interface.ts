import { ReportGeneratorServiceInterface } from './report-generator-service.interface';
import { ReportSettingsInterface } from './report-settings.interface';

export interface ReportOptionsInterface {
  reportGeneratorServices?: ReportGeneratorServiceInterface[];
  settings?: ReportSettingsInterface;
}
