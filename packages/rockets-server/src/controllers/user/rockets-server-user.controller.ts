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
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { UserUpdateDto, UserDto } from '@concepta/nestjs-user';
import { UserEntityInterface } from '@concepta/nestjs-user';
import { AuthJwtGuard } from '@concepta/nestjs-auth-jwt';

/**
 * Controller for managing user profile operations
 */
@Controller('user')
@UseGuards(AuthJwtGuard)
@ApiTags('user')
@ApiBearerAuth()
export class RocketsServerUserController {
  constructor(
    @Inject(UserMutateService)
    private readonly userMutateService: UserMutateService,
    @Inject(UserLookupService)
    private readonly userLookupService: UserLookupService,
  ) {}

  @ApiOperation({
    summary: 'Get a user by ID',
    description:
      "Retrieves the currently authenticated user's profile information",
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
  })
  @Get('')
  async findById(
    @AuthUser('id') id: string,
  ): Promise<UserEntityInterface | null> {
    return this.userLookupService.byId(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description:
      "Updates the currently authenticated user's profile information",
  })
  @ApiBody({
    type: UserUpdateDto,
    description: 'User profile information to update',
    examples: {
      user: {
        value: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        summary: 'Standard user update',
      },
    },
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid input data',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User not authenticated',
  })
  @Patch('')
  async update(
    @AuthUser('id') id: string,
    @Body() userUpdateDto: UserUpdateDto,
  ): Promise<UserEntityInterface> {
    return this.userMutateService.update({ id, ...userUpdateDto });
  }
}
