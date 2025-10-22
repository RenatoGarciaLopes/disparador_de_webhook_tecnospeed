import { RouterImplementation } from "@/shared/RouterImplementation";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { AuthMiddleware } from "@/shared/modules/auth/interfaces/http/middlewares/auth.middleware";
import { ProtocolosService } from "@/modules/protocolo/domain/services/ProtocolosService";
import { WebhookReprocessadoRepository } from "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository";
import { BodyMiddleware } from "../middlewares/protocolo/body.middleware";
import { CacheService } from "@/infrastructure/cache/cache.service";

export class ProtocolosRoutes extends RouterImplementation {
  protected configure(): void {
    this.router.get(
      "/protocolos",
      (req, res, next) => AuthMiddleware.validate(req as any, res, next),
      BodyMiddleware.validate,
      (req, res) => {
        return new ProtocolosController(
          new ProtocolosService(
            new WebhookReprocessadoRepository(),
            CacheService.getInstance(),
          ),
        ).getProtocolos(req as any, res);
      },
    );

    this.router.get(
      "/protocolos/:id",
      (req, res, next) => AuthMiddleware.validate(req as any, res, next),
      (req, res) => {
        return new ProtocolosController(
          new ProtocolosService(
            new WebhookReprocessadoRepository(),
            CacheService.getInstance(),
          ),
        ).getProtolocoById(req as any, res);
      },
    );
  }
}
