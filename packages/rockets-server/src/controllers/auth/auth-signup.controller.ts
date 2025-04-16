import { AuthPublic } from '@concepta/nestjs-authentication';
import { UserMutateService } from '@concepta/nestjs-user';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RocketsServerUserCreateDto } from '../../dto/user/rockets-server-user-create.dto';
import { RocketsServerUserDto } from '../../dto/user/rockets-server-user.dto';
import { RocketsServerUserEntityInterface } from '../../interfaces/user/rockets-server-user-entity.interface';

/**
 * Controller for user registration/signup
 * Allows creating new user accounts
 */
@Controller('signup')
@AuthPublic()
@ApiTags('auth')
export class AuthSignupController {
  constructor(
    @Inject(UserMutateService)
    private readonly userMutateService: UserMutateService,
  ) {}

  @ApiOperation({
    summary: 'Create a new user account',
    description:
      'Registers a new user in the system with email, username and password',
  })
  @ApiBody({
    type: RocketsServerUserCreateDto,
    description: 'User registration information',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
          username: 'johndoe',
          password: 'StrongP@ssw0rd',
          active: true,
        },
        summary: 'Standard user registration',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: RocketsServerUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid input data or missing required fields',
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
  })
  @Post()
  async create(
    @Body() userCreateDto: RocketsServerUserCreateDto,
  ): Promise<RocketsServerUserEntityInterface> {
    return this.userMutateService.create(userCreateDto);
  }
}
