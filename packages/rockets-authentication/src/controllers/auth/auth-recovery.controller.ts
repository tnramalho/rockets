import { AuthRecoveryRecoverLoginDto, AuthRecoveryRecoverPasswordDto, AuthRecoveryService, AuthRecoveryServiceInterface, AuthRecoveryUpdatePasswordDto } from '@concepta/nestjs-auth-recovery';
import { AuthRecoveryOtpInvalidException } from '@concepta/nestjs-auth-verify';
import { AuthPublic } from '@concepta/nestjs-authentication';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@Controller('recovery')
@AuthPublic()
@ApiTags('auth')
export class AuthRecoveryController {
  constructor(
    @Inject(AuthRecoveryService)
    private readonly authRecoveryService: AuthRecoveryServiceInterface,
  ) {}

  @ApiOperation({
    summary:
      'Recover account username password by providing an email that will receive an username.',
  })
  @ApiBody({
    type: AuthRecoveryRecoverLoginDto,
    description: 'DTO of login recover.',
  })
  @ApiOkResponse()
  @Post('/login')
  async recoverLogin(
    @Body() recoverLoginDto: AuthRecoveryRecoverLoginDto,
  ): Promise<void> {
    await this.authRecoveryService.recoverLogin(recoverLoginDto.email);
  }

  @ApiOperation({
    summary:
      'Recover account email password by providing an email that will receive a password reset link.',
  })
  @ApiBody({
    type: AuthRecoveryRecoverPasswordDto,
    description: 'DTO of email recover.',
  })
  @ApiOkResponse()
  @Post('/password')
  async recoverPassword(
    @Body() recoverPasswordDto: AuthRecoveryRecoverPasswordDto,
  ): Promise<void> {
    await this.authRecoveryService.recoverPassword(recoverPasswordDto.email);
  }

  // TODO: maybe we dont need
  @ApiOperation({
    summary: 'Check if passcode is valid.',
  })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Get('/passcode/:passcode')
    // TODO: do we actually need this? since we already gonna validate on next endpoint
  async validatePasscode(@Param('passcode') passcode: string): Promise<void> {
    // TODO: do we need to add email to validate? or valid token
    const otp = await this.authRecoveryService.validatePasscode(passcode);

    if (!otp) {
      throw new AuthRecoveryOtpInvalidException();
    }
  }

  @ApiOperation({
    summary: 'Update lost password by providing passcode and new password.',
  })
  @ApiBody({
    type: AuthRecoveryUpdatePasswordDto,
    description: 'DTO of update password.',
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @Patch('/password')
  async updatePassword(
    @Body() updatePasswordDto: AuthRecoveryUpdatePasswordDto,
  ): Promise<void> {
    const { passcode, newPassword } = updatePasswordDto;

    const user = await this.authRecoveryService.updatePassword(
      passcode,
      newPassword,
    );

    if (!user) {
      // the client should have checked using validate passcode first
      throw new AuthRecoveryOtpInvalidException();
    }
  }
}
