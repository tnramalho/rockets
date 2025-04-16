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
import { RocketsServerUserUpdateDto } from '../../dto/user/rockets-server-user-update.dto';
import { RocketsServerUserDto } from '../../dto/user/rockets-server-user.dto';
import { RocketsServerUserEntityInterface } from '../../interfaces/user/rockets-server-user-entity.interface';
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
    type: RocketsServerUserDto,
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
  ): Promise<RocketsServerUserEntityInterface | null> {
    return this.userLookupService.byId(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description:
      "Updates the currently authenticated user's profile information",
  })
  @ApiBody({
    type: RocketsServerUserUpdateDto,
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
    type: RocketsServerUserDto,
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
    @Body() userUpdateDto: RocketsServerUserUpdateDto,
  ): Promise<RocketsServerUserEntityInterface> {
    return this.userMutateService.update({ id, ...userUpdateDto });
  }
}
