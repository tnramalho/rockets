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
  AuthUser,
  AuthenticationJwtResponseDto,
  AuthPublic,
} from '@concepta/nestjs-authentication';
import {
  AuthRefreshGuard,
  AuthRefreshIssueTokenService,
  AuthRefreshDto,
} from '@concepta/nestjs-auth-refresh';

/**
 * Auth Local controller
 */
@Controller('token/refresh')
@UseGuards(AuthRefreshGuard)
@AuthPublic()
@ApiTags('auth')
export class AuthRefreshControllerFixture {
  constructor(
    @Inject(AuthRefreshIssueTokenService)
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
