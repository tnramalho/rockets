import { UserMutateService } from '@concepta/nestjs-user';
import { AuthPublic, AuthenticationJwtResponseDto } from '@concepta/nestjs-authentication';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiSecurity,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { UserCreateDto, UserDto } from '@concepta/nestjs-user';
import { UserEntityInterface } from '@concepta/nestjs-user';

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
    description: 'Registers a new user in the system with email, username and password',
  })
  @ApiBody({
    type: UserCreateDto,
    description: 'User registration information',
    examples: {
      standard: {
        value: {
          email: 'user@example.com',
          username: 'johndoe',
          password: 'StrongP@ssw0rd',
          active: true
        },
        summary: 'Standard user registration'
      }
    }
  })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserDto
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid input data or missing required fields',
  })
  @ApiConflictResponse({
    description: 'Email or username already exists',
  })
  @Post()
  async create(
    @Body() userCreateDto: UserCreateDto,
  ): Promise<UserEntityInterface> {
    return this.userMutateService.create(userCreateDto);
  }
}
