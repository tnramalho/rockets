import { Module } from '@nestjs/common';

import { LoggerModule } from '../logger.module';

import { AppControllerFixture } from './app.controller.fixture';

@Module({
  controllers: [AppControllerFixture],
  imports: [LoggerModule.register({})],
})
export class AppModuleFixture {}
