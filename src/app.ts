import express, { type Express } from "express";
import { config } from "./infrastructure/config";

export class App {
  private server: Express;
  constructor() {
    this.server = express();
    this.server.use(express.json());
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
