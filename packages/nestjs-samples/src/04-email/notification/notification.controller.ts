import { Controller, Post, Body } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { EmailService } from '@concepta/nestjs-email';

import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notification')
@ApiTags('notification')
export class NotificationController {
  constructor(private readonly emailService: EmailService) {}

  @ApiOkResponse()
  @Post('/')
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    await this.emailService.sendMail({
      to: createNotificationDto.emailAddress,
      from: 'Rockets Email <rockets@email.com>',
      subject: 'Sample Email',
    });
  }
}
