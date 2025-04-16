import {
  AuthRecoveryService,
  AuthRecoveryServiceInterface,
} from '@concepta/nestjs-auth-recovery';
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
  ApiParam,
} from '@nestjs/swagger';
import { RocketsServerRecoverLoginDto } from '../../dto/auth/rockets-server-recover-login.dto';
import { RocketsServerRecoverPasswordDto } from '../../dto/auth/rockets-server-recover-password.dto';
import { RocketsServerUpdatePasswordDto } from '../../dto/auth/rockets-server-update-password.dto';

/**
 * Controller for account recovery operations
 * Handles login/username recovery, password reset, and passcode validation
 */
@Controller('recovery')
@AuthPublic()
@ApiTags('auth')
export class RocketsServerRecoveryController {
  constructor(
    @Inject(AuthRecoveryService)
    private readonly authRecoveryService: AuthRecoveryServiceInterface,
  ) {}

  @ApiOperation({
    summary: 'Recover username',
    description:
      'Sends an email with the username associated with the provided email address',
  })
  @ApiBody({
    type: RocketsServerRecoverLoginDto,
    description: 'Email address for username recovery',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
        },
        summary: 'Standard username recovery request',
      },
    },
  })
  @ApiOkResponse({
    description:
      'Recovery email sent successfully (returns regardless of whether email exists)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @Post('/login')
  async recoverLogin(
    @Body() recoverLoginDto: RocketsServerRecoverLoginDto,
  ): Promise<void> {
    await this.authRecoveryService.recoverLogin(recoverLoginDto.email);
  }

  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends an email with a password reset link to the provided email address',
  })
  @ApiBody({
    type: RocketsServerRecoverPasswordDto,
    description: 'Email address for password reset',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
        },
        summary: 'Standard password reset request',
      },
    },
  })
  @ApiOkResponse({
    description:
      'Recovery email sent successfully (returns regardless of whether email exists)',
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @Post('/password')
  async recoverPassword(
    @Body() recoverPasswordDto: RocketsServerRecoverPasswordDto,
  ): Promise<void> {
    await this.authRecoveryService.recoverPassword(recoverPasswordDto.email);
  }

  @ApiOperation({
    summary: 'Validate recovery passcode',
    description: 'Checks if the provided passcode is valid and not expired',
  })
  @ApiParam({
    name: 'passcode',
    description: 'Recovery passcode to validate',
    example: 'abc123def456',
  })
  @ApiOkResponse({
    description: 'Passcode is valid',
  })
  @ApiNotFoundResponse({
    description: 'Passcode is invalid or expired',
  })
  @Get('/passcode/:passcode')
  async validatePasscode(@Param('passcode') passcode: string): Promise<void> {
    const otp = await this.authRecoveryService.validatePasscode(passcode);

    if (!otp) {
      throw new AuthRecoveryOtpInvalidException();
    }
  }

  @ApiOperation({
    summary: 'Reset password',
    description: 'Updates the user password using a valid recovery passcode',
  })
  @ApiBody({
    type: RocketsServerUpdatePasswordDto,
    description: 'Passcode and new password information',
    examples: {
      standard: {
        value: {
          passcode: 'abc123def456',
          newPassword: 'NewSecureP@ssw0rd',
        },
        summary: 'Standard password reset',
      },
    },
  })
  @ApiOkResponse({
    description: 'Password updated successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid passcode, password requirements not met, or passcode expired',
  })
  @Patch('/password')
  async updatePassword(
    @Body() updatePasswordDto: RocketsServerUpdatePasswordDto,
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
