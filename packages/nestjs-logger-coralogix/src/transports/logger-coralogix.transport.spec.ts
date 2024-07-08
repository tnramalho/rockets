import { Log } from 'coralogix-logger';
import { LoggerCoralogixConfigInterface } from '../interfaces/logger-coralogix-config.interface';
import { LoggerCoralogixSettingsInterface } from '../interfaces/logger-coralogix-settings.interface';
import { LoggerCoralogixTransport } from './logger-coralogix.transport';
import { LogLevel } from '@nestjs/common';
import { LoggerMessageInterface } from '@concepta/nestjs-logger/dist/interfaces/logger-message.interface';

jest.mock('axios', () => {
  return {
    post: jest.fn(() => Promise.resolve({ data: {} })),
  };
});

jest.mock('coralogix-logger');

describe('loggerCoralogixTransport', () => {
  let loggerCoralogixTransport: LoggerCoralogixTransport;
  let settings: LoggerCoralogixSettingsInterface;

  beforeEach(async () => {
    const transportConfig: LoggerCoralogixConfigInterface = {
      privateKey: 'private-key',
      category: 'testers',
      logLevelMap: (_logLevel: LogLevel) => {
        return 3;
      },
      formatMessage: (_loggerMessage: LoggerMessageInterface): string => {
        return '';
      },
    };
    settings = {
      transportConfig,
      logLevel: ['error'],
    };
    loggerCoralogixTransport = new LoggerCoralogixTransport(settings);
  });

  describe('IsDefined', () => {
    it('was loggerCoralogixTransport defined', async () => {
      expect(loggerCoralogixTransport).toBeDefined();
    });
  });

  it('LoggerCoralogixTransport initialized with correct log levels and category', async () => {
    const expectedLogLevels = ['error'];
    const expectedCategory = 'testers';

    expect(loggerCoralogixTransport.logLevel).toEqual(expectedLogLevels);
    expect(
      loggerCoralogixTransport['settings'].transportConfig.category,
    ).toEqual(expectedCategory);
  });

  it('should log a message with the correct severity and formatted text', () => {
    const message = 'Test message';
    const logLevel = 'log';
    const error = 'Test error';

    // Spying on the methods before calling the log method
    const logLevelMap = jest.spyOn(
      loggerCoralogixTransport['settings'].transportConfig,
      'logLevelMap',
    );
    const formatMessage = jest.spyOn(
      loggerCoralogixTransport['settings'].transportConfig,
      'formatMessage',
    );

    loggerCoralogixTransport.log(message, logLevel, error);

    expect(logLevelMap).toHaveBeenCalledWith(logLevel);
    expect(formatMessage).toHaveBeenCalledWith({ message, logLevel, error });

    const expectedLog = new Log({
      severity: 3,
      text: 'Test message',
    });

    expect(loggerCoralogixTransport['coralogix'].addLog).toHaveBeenCalledWith(
      expectedLog,
    );
  });
});