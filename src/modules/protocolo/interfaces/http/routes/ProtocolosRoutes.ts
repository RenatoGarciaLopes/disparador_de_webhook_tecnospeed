import { CacheService } from "@/infrastructure/cache/cache.service";
import { RateLimitService } from "@/infrastructure/rate-limit/rate-limit.service";
import { ThrottleService } from "@/infrastructure/throttle/throttle.service";
import { AuthMiddleware } from "@/modules/auth/interfaces/http/middlewares/auth.middleware";
import { ProtocolosService } from "@/modules/protocolo/domain/services/ProtocolosService";
import { WebhookReprocessadoRepository } from "@/modules/protocolo/infrastructure/database/repositories/WebHookReprocessadoRespository";
import { RouterImplementation } from "@/shared/core/RouterImplementation";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { BodyMiddleware } from "../middlewares/protocolo/body.middleware";

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 1 * 60 * 1000;

export class ProtocolosRoutes extends RouterImplementation {
  protected configure(): void {
    this.router.use("/protocolos", new RateLimitService(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS).client);
    this.router.use("/protocolos", ThrottleService.getInstance().client);

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
