import pino from "pino";

const isDev =
  (process.env.NODE_ENV || "development").toLowerCase() !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});

export class Logger {
  static info(message: string): void {
    logger.info(message);
  }

  static error(message: string): void {
    logger.error(message);
  }

  static warn(message: string): void {
    logger.warn(message);
  }

  static debug(message: string): void {
    logger.debug(message);
  }
}
