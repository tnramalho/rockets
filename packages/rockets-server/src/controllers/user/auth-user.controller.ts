import { UserMutateService, UserLookupService } from '@concepta/nestjs-user';
import { AuthUser } from '@concepta/nestjs-authentication';
import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserUpdateDto } from '@concepta/nestjs-user';
import { UserEntityInterface } from '@concepta/nestjs-user';
import { AuthJwtGuard } from '@concepta/nestjs-auth-jwt';

@Controller('user')
@UseGuards(AuthJwtGuard)
@ApiTags('auth')
export class AuthUserController {
  constructor(
    // same from user module
    @Inject(UserMutateService)
    private readonly userMutateService: UserMutateService,
    @Inject(UserLookupService)
    private readonly userLookupService: UserLookupService,
  ) {}

  @ApiOperation({
    summary: 'Get a user by ID',
  })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @Get('')
  async findById(
    @AuthUser('id') id: string,
  ): Promise<UserEntityInterface | null> {
    return this.userLookupService.byId(id);
  }

  @ApiOperation({
    summary: 'Update a user',
  })
  @ApiBody({
    type: UserUpdateDto,
    description: 'DTO for updating a user',
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiNotFoundResponse()
  @Patch('')
  async update(
    @AuthUser('id') id: string,
    @Body() userUpdateDto: UserUpdateDto,
  ): Promise<UserEntityInterface> {
    return this.userMutateService.update({ id, ...userUpdateDto });
  }
}
