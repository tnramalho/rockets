import { SeverityLevel } from '@sentry/types';

import { LogLevel } from '@nestjs/common';

import { LoggerMessageInterface } from '@concepta/nestjs-logger';
/**
 * Mapping from log level to sentry severity
 *
 * @param logLevel - The log level
 * @returns Severity
 */
export const logLevelMap = (logLevel: LogLevel): SeverityLevel => {
  switch (logLevel) {
    case 'error':
      return 'error';
    case 'debug':
      return 'debug';
    case 'log':
      return 'log';
    case 'warn':
      return 'warning';
    case 'verbose':
      return 'info';
    default:
      return 'log';
  }
};

export const formatMessage = (
  loggerMessage: LoggerMessageInterface,
): string => {
  return loggerMessage.message || '';
};
