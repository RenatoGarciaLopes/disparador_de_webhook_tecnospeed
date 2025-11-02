import express from "express";
import swaggerUi from "swagger-ui-express";
import { config } from "@/infrastructure/config";
import { getOpenApiDocument } from "@/infrastructure/docs/openapi";
import { ProtocolosRoutes } from "@/modules/protocolo/interfaces/http/routes/ProtocolosRoutes";
import { ReenviarRouter } from "@/modules/webhook/interfaces/http/routes/ReenviarRouter";

export class App {
  public server: any;
  constructor() {
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
  }

  public start(port: number) {
    this.server
      .listen(port, () => {
        console.log("--------------------------------");
        console.log("Tecnospeed - Webhook Dispatcher");
        console.log("--------------------------------");
        console.log(`🌐 Environment: ${config.NODE_ENV}`);
        console.log(`🚀 Server is running on port: ${port}`);
        console.log(`🔗 Access: http://localhost:${port}/docs`);
        console.log("\n");
      })
      .on("error", console.error);
  }
}
