import { Module } from '@nestjs/common';

import { LoggerModule } from '@concepta/nestjs-logger';

import { LoggerSentryModule } from '../logger-sentry.module';
import { LoggerSentryTransport } from '../transports/logger-sentry.transport';
import { formatMessage, logLevelMap } from '../utils';

import { AppControllerFixture } from './app.controller.fixture';

@Module({
  controllers: [AppControllerFixture],
  imports: [
    LoggerSentryModule.forRoot({
      settings: {
        logLevel: ['warn'],
        logLevelMap: logLevelMap,
        formatMessage: formatMessage,
        transportConfig: {
          dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
        },
      },
    }),
    LoggerModule.forRootAsync({
      inject: [LoggerSentryTransport],
      useFactory: (loggerSentryTransport: LoggerSentryTransport) => {
        return {
          transports: [loggerSentryTransport],
        };
      },
    }),
  ],
})
export class AppWarnModuleFixture {}
