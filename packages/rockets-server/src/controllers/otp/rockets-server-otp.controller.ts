import { AuthLocalIssueTokenService } from '@concepta/nestjs-auth-local';
import {
  AuthPublic,
  IssueTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import { Body, Controller, Inject, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RocketsServerJwtResponseDto } from '../../dto/auth/rockets-server-jwt-response.dto';
import { RocketsServerOtpConfirmDto } from '../../dto/rockets-server-otp-confirm.dto';
import { RocketsServerOtpSendDto } from '../../dto/rockets-server-otp-send.dto';
import { RocketsServerAuthenticationResponseInterface } from '../../interfaces/common/rockets-server-authentication-response.interface';
import { RocketsServerOtpService } from '../../services/rockets-server-otp.service';

/**
 * Controller for One-Time Password (OTP) operations
 * Handles sending and confirming OTPs for authentication
 */
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
    description:
      'Generates a one-time passcode and sends it to the specified email address',
  })
  @ApiBody({
    type: RocketsServerOtpSendDto,
    description: 'Email to receive the OTP',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
        },
        summary: 'Standard OTP request',
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @Post('')
  async sendOtp(@Body() dto: RocketsServerOtpSendDto): Promise<void> {
    return this.otpService.sendOtp(dto.email);
  }

  @ApiOperation({
    summary: 'Confirm OTP for a given email and passcode',
    description:
      'Validates the OTP passcode for the specified email and returns authentication tokens on success',
  })
  @ApiBody({
    type: RocketsServerOtpConfirmDto,
    description: 'Email and passcode for OTP verification',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
          passcode: '123456',
        },
        summary: 'Standard OTP confirmation',
      },
    },
  })
  @ApiOkResponse({
    description: 'OTP confirmed successfully, authentication tokens provided',
    type: RocketsServerJwtResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format or missing required fields',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid OTP or expired passcode',
  })
  @Patch('')
  async confirmOtp(
    @Body() dto: RocketsServerOtpConfirmDto,
  ): Promise<RocketsServerAuthenticationResponseInterface> {
    const user = await this.otpService.confirmOtp(dto.email, dto.passcode);
    return this.issueTokenService.responsePayload(user.id);
  }
}
