import {
  AuthLocalGuard,
  AuthLocalIssueTokenService,
} from '@concepta/nestjs-auth-local';
import {
  AuthPublic,
  AuthUser,
  IssueTokenServiceInterface,
} from '@concepta/nestjs-authentication';
import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RocketsServerJwtResponseDto } from '../../dto/auth/rockets-server-jwt-response.dto';
import { RocketsServerLoginDto } from '../../dto/auth/rockets-server-login.dto';
import { RocketsServerAuthenticationResponseInterface } from '../../interfaces/common/rockets-server-authentication-response.interface';
import { RocketsServerUserInterface } from '../../interfaces/common/rockets-server-user.interface';

/**
 * Controller for password-based authentication
 * Handles user login with username/email and password
 */
@Controller('token/password')
@UseGuards(AuthLocalGuard)
@AuthPublic()
@ApiTags('auth')
export class AuthPasswordController {
  constructor(
    @Inject(AuthLocalIssueTokenService)
    private issueTokenService: IssueTokenServiceInterface,
  ) {}

  @ApiOperation({
    summary: 'Authenticate with username/email and password',
    description:
      'Validates credentials and returns authentication tokens on success',
  })
  @ApiBody({
    type: RocketsServerLoginDto,
    description: 'User credentials',
    examples: {
      standard: {
        value: {
          username: 'user@example.com',
          password: 'YourPassword123!',
        },
        summary: 'Standard login request',
      },
    },
  })
  @ApiOkResponse({
    type: RocketsServerJwtResponseDto,
    description: 'Authentication successful, tokens provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
  })
  @Post()
  async login(
    @AuthUser() user: RocketsServerUserInterface,
  ): Promise<RocketsServerAuthenticationResponseInterface> {
    return this.issueTokenService.responsePayload(user.id);
  }
}
