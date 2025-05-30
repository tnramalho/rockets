import { Module } from '@nestjs/common';

import { LoggerModule } from '@concepta/nestjs-logger';

import { LoggerCoralogixModule } from '../logger-coralogix.module';
import { LoggerCoralogixTransport } from '../transports/logger-coralogix.transport';
import { formatMessage, logLevelMap } from '../utils';

import { AppControllerFixture } from './app.controller.fixture';
@Module({
  controllers: [AppControllerFixture],
  imports: [
    LoggerCoralogixModule.forRoot({
      settings: {
        logLevel: ['warn'],
        logLevelMap,
        formatMessage,
        transportConfig: {
          privateKey: 'private',
          category: 'logging',
        },
      },
    }),
    LoggerModule.forRootAsync({
      inject: [LoggerCoralogixTransport],
      useFactory: (loggerCoralogixTransport: LoggerCoralogixTransport) => {
        return {
          transports: [loggerCoralogixTransport],
        };
      },
    }),
  ],
})
export class AppWarnModuleFixture {}
