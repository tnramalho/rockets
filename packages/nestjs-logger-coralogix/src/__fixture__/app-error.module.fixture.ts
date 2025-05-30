import { Severity } from 'coralogix-logger';

import { LogLevel, Module } from '@nestjs/common';

import { LoggerModule } from '@concepta/nestjs-logger';

import { LoggerCoralogixModule } from '../logger-coralogix.module';
import { LoggerCoralogixTransport } from '../transports/logger-coralogix.transport';
import { formatMessage } from '../utils';

import { AppControllerFixture } from './app.controller.fixture';
@Module({
  controllers: [AppControllerFixture],
  imports: [
    LoggerCoralogixModule.forRoot({
      settings: {
        logLevel: ['error'],
        logLevelMap: (_logLevel: LogLevel): Severity => {
          return Severity.info;
        },
        formatMessage: formatMessage,
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
export class AppErrorModuleFixture {}
