import { Logger } from "@/infrastructure/logger/logger";
import { sequelize } from "@/sequelize";

export class DatabaseService {
  async connect(): Promise<boolean> {
    Logger.info("Attempting to authenticate database connection");

    const cantAuthenticate = await sequelize
      .authenticate()
      .then(() => {
        Logger.info("Database authentication successful");
        return false;
      })
      .catch((error) => {
        Logger.error(
          `Database authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return true;
      });

    if (cantAuthenticate) return false;

    Logger.info("Attempting to sync database models");

    const cantSync = await sequelize
      .sync()
      .then(() => {
        Logger.info("Database models synchronized successfully");
        return false;
      })
      .catch((error) => {
        Logger.error(
          `Database synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        return true;
      });

    if (cantSync) return false;

    Logger.info("Database connection established and synchronized");
    return true;
  }
}
