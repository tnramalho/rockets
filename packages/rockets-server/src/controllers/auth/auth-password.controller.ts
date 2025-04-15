import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiSecurity,
} from '@nestjs/swagger';
import {
  AuthenticatedUserInterface,
  AuthenticationResponseInterface,
} from '@concepta/nestjs-common';
import {
  AuthUser,
  IssueTokenServiceInterface,
  AuthenticationJwtResponseDto,
  AuthPublic,
} from '@concepta/nestjs-authentication';
import {
  AuthLocalGuard,
  AuthLocalIssueTokenService,
  AuthLocalLoginDto,
} from '@concepta/nestjs-auth-local';

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
    description: 'Validates credentials and returns authentication tokens on success',
  })
  @ApiBody({
    type: AuthLocalLoginDto,
    description: 'User credentials',
    examples: {
      standard: {
        value: {
          username: 'user@example.com',
          password: 'YourPassword123!'
        },
        summary: 'Standard login request'
      }
    }
  })
  @ApiOkResponse({
    type: AuthenticationJwtResponseDto,
    description: 'Authentication successful, tokens provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account'
  })
  @Post()
  async login(
    @AuthUser() user: AuthenticatedUserInterface,
  ): Promise<AuthenticationResponseInterface> {
    return this.issueTokenService.responsePayload(user.id);
  }
}
