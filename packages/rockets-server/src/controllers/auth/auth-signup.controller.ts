import { UserMutateService } from '@concepta/nestjs-user';
import { AuthPublic } from '@concepta/nestjs-authentication';
import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserCreateDto } from '@concepta/nestjs-user';
import { UserEntityInterface } from '@concepta/nestjs-user';

@Controller('signup')
@AuthPublic()
@ApiTags('auth')
export class AuthSignupController {
  constructor(
    @Inject(UserMutateService)
    private readonly userMutateService: UserMutateService,
  ) {}

  @ApiOperation({
    summary: 'Create a new user',
  })
  @ApiBody({
    type: UserCreateDto,
    description: 'DTO for creating a new user',
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @Post()
  async create(
    @Body() userCreateDto: UserCreateDto,
  ): Promise<UserEntityInterface> {
    return this.userMutateService.create(userCreateDto);
  }
} 