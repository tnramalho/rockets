import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  AuthenticationJwtResponseDto,
  AuthPublic,
  AuthUser,
} from '@concepta/nestjs-authentication';
import { AuthenticatedUserInterface } from '@concepta/nestjs-common';

import { AuthRouterGuard } from '../auth-router.guard';

@Controller('auth-router')
@UseGuards(AuthRouterGuard)
@AuthPublic()
@ApiTags('auth')
export class AuthRouterControllerFixture {
  constructor() {}

  /**
   * Login
   */
  @ApiOkResponse({
    description: 'Users are redirected to request their Auth Router identity.',
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
