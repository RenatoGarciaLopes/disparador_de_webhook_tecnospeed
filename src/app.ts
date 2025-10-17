import express, { type Express } from "express";
import { config } from "./infrastructure/config";
import { ReenviarController } from "./modules/webhook/interfaces/http/controllers/ReenviarController";
import { ReenviarRoutes } from "./modules/webhook/interfaces/http/routes/ReenviarRoutes";

export class App {
  private server: Express;
  constructor() {
    this.server = express();
    this.server.use(express.json());

    const reenviarRoutes = new ReenviarRoutes(new ReenviarController());
    this.server.use(reenviarRoutes.router);
  }

  public start(port: number) {
    this.server
      .listen(port, () => {
        console.log("--------------------------------");
        console.log("TecnoSpeed - Webhook Dispatcher");
        console.log("--------------------------------");
        console.log(`🌐 Environment: ${config.NODE_ENV}`);
        console.log(`🚀 Server is running on port: ${port}`);
        console.log(`🔗 Access: http://localhost:${port}/docs`);
        console.log("\n");
      })
      .on("error", console.error);
  }
}
