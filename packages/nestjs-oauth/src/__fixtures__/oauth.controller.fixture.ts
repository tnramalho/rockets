import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  AuthenticationJwtResponseDto,
  AuthPublic,
  AuthUser,
} from '@concepta/nestjs-authentication';
import { AuthenticatedUserInterface } from '@concepta/nestjs-common';

import { OAuthGuard } from '../oauth.guard';

@Controller('oauth')
@UseGuards(OAuthGuard)
@AuthPublic()
@ApiTags('auth')
export class OAuthControllerFixture {
  constructor() {}

  /**
   * Login
   */
  @ApiOkResponse({
    description: 'Users are redirected to request their OAuth identity.',
  })
  @Get('login')
  login(): void {
    // TODO: no code needed, Decorator will redirect to google
    return;
  }

  @ApiOkResponse({
    type: AuthenticationJwtResponseDto,
    description: 'DTO containing an access token and a refresh token.',
  })
  @Get('callback')
  async callback(@AuthUser() _user: AuthenticatedUserInterface) {
    return {
      ok: 'success',
    };
  }

  @ApiOkResponse({
    type: AuthenticationJwtResponseDto,
    description: 'DTO containing an access token and a refresh token.',
  })
  @Post('callback')
  async postCallback(@AuthUser() _user: AuthenticatedUserInterface) {
    return {
      ok: 'success',
    };
  }
}
