import { Inject, Injectable, LogLevel } from '@nestjs/common';
import { LOGGER_MODULE_SETTINGS_TOKEN } from './config/logger.config';
import { LoggerSettingsInterface } from './interfaces/logger-settings.interface';
import { LoggerTransportInterface } from './interfaces/logger-transport.interface';

/**
 * A transport service that will load all third party transport
 * that will be used to log messages to external
 *
 * @example
 * ```ts
 * class TestTransport implements LoggerTransportInterface {
 *     log(): void {
 *       // forward message to transport
 *     }
 * }
 *
 * const app = await NestFactory.create(AppModule, {
 *   logger: loggerConfig().logLevel,
 * });
 *
 * const customLoggerService = app.get(LoggerService);
 *
 * const testTransport = new TestTransport();
 *
 * customLoggerService.addTransport(testTransport);
 * ```
 */
@Injectable()
export class LoggerTransportService {
  /**
   * Log level definitions
   *
   */
  private readonly logLevels: LogLevel[] = ['error'];

  /**
   * External Logger transports
   */
  private readonly loggerTransports: LoggerTransportInterface[] = [];

  /**
   * Constructor
   *
   * @param settings - logger settings
   */
  constructor(
    @Inject(LOGGER_MODULE_SETTINGS_TOKEN)
    protected readonly settings: LoggerSettingsInterface,
  ) {
    if (this.settings?.transportLogLevel) {
      this.logLevels = this.settings.transportLogLevel;
    }
  }

  /**
   * Method to add the transport that will be used
   *
   * @param transport - Instance of a logger transport
   */
  public addTransport(transport: LoggerTransportInterface): void {
    this.loggerTransports.push(transport);
  }

  /**
   * Method to log message to the transport based on the log level
   *
   * @param message - message
   * @param logLevel - log level
   * @param error - error
   */
  public log(message: string, logLevel: LogLevel, error?: Error): void {
    // are we supposed to send this log level?
    if (this.logLevels.includes(logLevel)) {
      // yes, call all logger transports
      this.loggerTransports.map((loggerTransport) =>
        loggerTransport.log(message, logLevel, error),
      );
    }
  }
}
