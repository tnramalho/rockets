import {
  Controller,
  Logger,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { InvitationAcceptanceService } from '../services/invitation-acceptance.service';
import { InvitationDto } from '../dto/invitation.dto';
import { InvitationSendService } from '../services/invitation-send.service';
import { InvitationNotFoundException } from '../exceptions/invitation-not-found.exception';

@Controller('invitation-reattempt')
@ApiTags('invitation-reattempt')
export class InvitationReattemptController {
  constructor(
    private readonly invitationAcceptanceService: InvitationAcceptanceService,
    private readonly invitationSendService: InvitationSendService,
  ) {}

  @UsePipes(new ValidationPipe({ transform: true, forbidUnknownValues: true }))
  @ApiOperation({
    summary: 'Reattempt one invitation by code',
  })
  @ApiOkResponse()
  @Post('/:code')
  async reattemptInvite(@Param('code') code: string): Promise<void> {
    let invitation: InvitationDto | null | undefined;

    try {
      invitation = await this.invitationAcceptanceService.getOneByCode(code);
    } catch (e: unknown) {
      Logger.error(e);
    }

    if (!invitation) {
      throw new InvitationNotFoundException();
    }

    const { category, user, email } = invitation;

    await this.invitationSendService.send({ ...user, email }, code, category);
  }
}
