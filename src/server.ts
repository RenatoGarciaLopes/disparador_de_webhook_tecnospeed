import { App } from "./app";
import { CacheService } from "./infrastructure/cache/cache.service";
import { config } from "./infrastructure/config";
import { DatabaseService } from "./infrastructure/database/database.service";

export async function bootstrap() {
  await new DatabaseService().connect();
  await CacheService.getInstance().connect();

  const app = new App();
  app.start(config.PORT);
}

bootstrap().catch((error) => {
  console.error("[error] Failed to bootstrap application:", error);
  process.exit(1);
});
