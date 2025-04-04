import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedUserInterface,
  AuthenticationResponseInterface,
} from '@concepta/nestjs-common';
import {
  IssueTokenServiceInterface,
  IssueTokenService,
  AuthUser,
  AuthenticationJwtResponseDto,
  AuthPublic,
} from '@concepta/nestjs-authentication';
import { AuthRefreshDto, AuthRefreshGuard } from '@concepta/nestjs-auth-refresh';
import { AUTH_REFRESH_MODULE_ISSUE_SERVICE_TOKEN } from '../../rockets-authentication.constants';

/**
 * Auth Local controller
 */
@Controller('auth/token/refresh')
@UseGuards(AuthRefreshGuard)
@AuthPublic()
@ApiTags('token')
export class AuthTokenRefreshController {
  constructor(
    @Inject(AUTH_REFRESH_MODULE_ISSUE_SERVICE_TOKEN)
    private issueTokenService: IssueTokenServiceInterface,
  ) {}

  /**
   * Login
   */
  @ApiBody({
    type: AuthRefreshDto,
    description: 'DTO containing a refresh token.',
  })
  @ApiOkResponse({
    type: AuthenticationJwtResponseDto,
    description: 'DTO containing an access token and a refresh token.',
  })
  @ApiUnauthorizedResponse()
  @Post()
  async refresh(
    @AuthUser() user: AuthenticatedUserInterface,
  ): Promise<AuthenticationResponseInterface> {
    return this.issueTokenService.responsePayload(user.id);
  }
}
