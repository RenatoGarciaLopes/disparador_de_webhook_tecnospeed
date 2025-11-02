import { App } from "@/app";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { config } from "@/infrastructure/config";
import { DatabaseService } from "@/infrastructure/database/database.service";
import { Logger } from "@/infrastructure/logger/logger";

export async function bootstrap() {
  Logger.info(`Starting application bootstrap (env: ${config.NODE_ENV})`);

  try {
    Logger.info("Connecting to database");
    const dbConnected = await new DatabaseService().connect();
    if (!dbConnected) {
      Logger.error("Database connection failed");
      process.exit(1);
    }

    Logger.info("Connecting to cache");
    await CacheService.getInstance().connect();

    Logger.info("Initializing Express application");
    const app = new App();

    Logger.info(`Starting HTTP server on port ${config.PORT}`);

    app.start(config.PORT);
  } catch (error) {
    Logger.error(
      `Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

bootstrap().catch((error) => {
  Logger.fatal(
    `Fatal error during bootstrap: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
