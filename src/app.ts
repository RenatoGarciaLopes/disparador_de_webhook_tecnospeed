import { config } from "@/infrastructure/config";
import { getOpenApiDocument } from "@/infrastructure/docs/openapi";
import { Logger } from "@/infrastructure/logger/logger";
import { ProtocolosRoutes } from "@/modules/protocolo/interfaces/http/routes/ProtocolosRoutes";
import { ReenviarRouter } from "@/modules/webhook/interfaces/http/routes/ReenviarRouter";
import express from "express";
import swaggerUi from "swagger-ui-express";

export class App {
  public server: any;
  constructor() {
    Logger.info("Initializing Express application");

    this.server = express();
    this.server.use(express.json());

    // Docs (JSON + UI)
    this.server.get("/docs.json", (_: any, res: any) => {
      res.json(getOpenApiDocument());
    });
    this.server.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(getOpenApiDocument(), { explorer: true }),
    );

    this.server.use(new ProtocolosRoutes().router);
    this.server.use(new ReenviarRouter().router);

    Logger.info("Routes registered successfully");
  }

  public start(port: number) {
    this.server
      .listen(port, () => {
        Logger.info(
          `HTTP server started successfully on port ${port} (env: ${config.NODE_ENV})`,
        );
        setTimeout(() => {
          console.log("--------------------------------");
          console.log("Tecnospeed - Webhook Dispatcher");
          console.log("--------------------------------");
          console.log(`🌐 Environment: ${config.NODE_ENV}`);
          console.log(`🚀 Server is running on port: ${port}`);
          console.log(`🔗 Access: http://localhost:${port}/docs`);
        }, 5 * 1000); // 5 segundos await all logs to be written
      })
      .on("error", (error: Error) => {
        Logger.error(`HTTP server error: ${error.message}`);
      });
  }
}
