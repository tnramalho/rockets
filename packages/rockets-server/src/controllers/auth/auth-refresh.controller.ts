import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiSecurity,
} from '@nestjs/swagger';
import { RocketsServerUserInterface } from '../../interfaces/common/rockets-server-user.interface';
import { RocketsServerAuthenticationResponseInterface } from '../../interfaces/common/rockets-server-authentication-response.interface';
import {
  IssueTokenServiceInterface,
  AuthUser,
  AuthPublic,
} from '@concepta/nestjs-authentication';
import {
  AuthRefreshGuard,
  AuthRefreshIssueTokenService,
} from '@concepta/nestjs-auth-refresh';
import { RocketsServerRefreshDto } from '../../dto/auth/rockets-server-refresh.dto';
import { RocketsServerJwtResponseDto } from '../../dto/auth/rockets-server-jwt-response.dto';

/**
 * Controller for JWT refresh token operations
 * Allows users to obtain a new access token using their refresh token
 */
@Controller('token/refresh')
@UseGuards(AuthRefreshGuard)
@AuthPublic()
@ApiTags('auth')
@ApiSecurity('bearer')
export class AuthTokenRefreshController {
  constructor(
    @Inject(AuthRefreshIssueTokenService)
    private issueTokenService: IssueTokenServiceInterface,
  ) {}

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token',
  })
  @ApiBody({
    type: RocketsServerRefreshDto,
    description: 'Refresh token information',
    examples: {
      standard: {
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        summary: 'Standard refresh token request',
      },
    },
  })
  @ApiOkResponse({
    type: RocketsServerJwtResponseDto,
    description: 'New access and refresh tokens',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  @Post()
  async refresh(
    @AuthUser() user: RocketsServerUserInterface,
  ): Promise<RocketsServerAuthenticationResponseInterface> {
    return this.issueTokenService.responsePayload(user.id);
  }
}
