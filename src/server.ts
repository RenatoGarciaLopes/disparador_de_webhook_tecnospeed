import { App } from "@/app";
import { CacheService } from "@/infrastructure/cache/cache.service";
import { config } from "@/infrastructure/config";
import { DatabaseService } from "@/infrastructure/database/database.service";
import { Logger } from "@/infrastructure/logger/logger";
import cluster from "node:cluster";

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

if (cluster.isPrimary && config.NODE_ENV !== "test") {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < config.CLUSTERS; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  bootstrap().catch((error) => {
    Logger.error(
      `Fatal error during bootstrap: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });

  console.log(`Worker ${process.pid} started`);
}
