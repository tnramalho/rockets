import {
  OtpClearInterface,
  OtpCreateInterface,
  OtpValidateInterface,
} from '@concepta/nestjs-common';

export interface RocketsServerOtpServiceInterface
  extends OtpCreateInterface,
    OtpValidateInterface,
    OtpClearInterface {}
