import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  AuthenticationJwtResponseDto,
  AuthPublic,
  AuthUser,
} from '@concepta/nestjs-authentication';
import { AuthenticatedUserInterface } from '@concepta/nestjs-common';

import { AuthGuardRouterGuard } from '../auth-guard-router.guard';

@Controller('auth-guard-router')
@UseGuards(AuthGuardRouterGuard)
@AuthPublic()
@ApiTags('auth')
export class AuthGuardRouterControllerFixture {
  constructor() {}

  /**
   * Login
   */
  @ApiOkResponse({
    description:
      'Users are redirected to request their Auth Guard Router identity.',
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
