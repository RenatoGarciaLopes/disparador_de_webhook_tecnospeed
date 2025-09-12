import { App } from "./app";
import { config } from "./infrastructure/config";
import { DatabaseService } from "./infrastructure/database/database.service";

async function bootstrap() {
  await new DatabaseService().connect();

  const app = new App();
  app.start(config.PORT);
}

bootstrap();
