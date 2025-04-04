import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  OtpCreateParamsInterface,
  ReferenceAssigneeInterface,
  ReferenceIdInterface,
} from '@concepta/nestjs-common';
import { OtpInterface } from '@concepta/nestjs-common';
import { RocketsOtpServiceInterface } from '../../interfaces/rockets-otp-service.interface';

@Injectable()
export class OtpServiceFixture implements RocketsOtpServiceInterface {
  async create({ otp }: OtpCreateParamsInterface): Promise<OtpInterface> {
    const { assignee, category, type } = otp;
    return {
      id: randomUUID(),
      category,
      type,
      assignee,
      active: true,
      passcode: 'GOOD_PASSCODE',
      expirationDate: new Date(),
      dateCreated: new Date(),
      dateUpdated: new Date(),
      dateDeleted: null,
      version: 1,
    };
  }

  async validate(
    _assignment: string,
    otp: Pick<OtpInterface, 'category' | 'passcode'>,
    _deleteIfValid: boolean,
  ): Promise<ReferenceAssigneeInterface<ReferenceIdInterface<string>> | null> {
    const userFixture = {
      id: 'abc',
      email: 'me@dispostable.com',
      username: 'me@dispostable.com',
    };
    
    return otp.passcode === 'GOOD_PASSCODE' ? { assignee: userFixture } : null;
  }

  async clear(
    _assignment: string,
    _otp: Pick<OtpInterface, 'category' | 'assignee'>,
  ): Promise<void> {
    return;
  }
}
