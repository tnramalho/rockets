import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RocketsServerOtpService } from '../../services/rockets-server-otp.service';
import {
  AuthPublic,
  IssueTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import { RocketsServerOtpSendDto } from '../../dto/rockets-server-otp-send.dto';
import { RocketsServerOtpConfirmDto } from '../../dto/rockets-server-otp-confirm.dto';
import { AuthLocalIssueTokenService } from '@concepta/nestjs-auth-local';
import { AuthenticationResponseInterface } from '@concepta/nestjs-common';

@Controller('otp')
@AuthPublic()
@ApiTags('otp')
export class RocketsServerOtpController {
  constructor(
    @Inject(AuthLocalIssueTokenService)
    private issueTokenService: IssueTokenServiceInterface,
    private readonly otpService: RocketsServerOtpService,
  ) {}

  @ApiOperation({
    summary: 'Send OTP to the provided email',
  })
  @ApiBody({ type: RocketsServerOtpSendDto })
  @ApiOkResponse()
  @Post('send')
  async sendOtp(@Body() dto: RocketsServerOtpSendDto): Promise<void> {
    return this.otpService.sendOtp(dto.email);
  }

  @ApiOperation({
    summary: 'Confirm OTP for a given email and passcode',
  })
  @ApiBody({ type: RocketsServerOtpConfirmDto })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @Post('confirm')
  async confirmOtp(
    @Body() dto: RocketsServerOtpConfirmDto,
  ): Promise<AuthenticationResponseInterface> {
    const user = await this.otpService.confirmOtp(dto.email, dto.passcode);
    return this.issueTokenService.responsePayload(user.id);
  }
}
