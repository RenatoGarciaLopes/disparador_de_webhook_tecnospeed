import { CacheService } from "@/infrastructure/cache/cache.service";
import { TecnospeedClient } from "@/infrastructure/tecnospeed/TecnospeedClient";
import { AuthMiddleware } from "@/modules/auth/interfaces/http/middlewares/auth.middleware";
import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ServicoRepository } from "@/modules/webhook/infrastructure/repositories/ServicoRepository";
import { WebhookReprocessadoRepository } from "@/modules/webhook/infrastructure/repositories/WebhookReprocessadoRepository";
import { RouterImplementation } from "@/shared/core/RouterImplementation";
import { ReenviarController } from "../controllers/ReenviarController";
import { BodyMiddleware } from "../middlewares/body.middleware";

export class ReenviarRouter extends RouterImplementation {
  protected configure() {
    this.router.post(
      "/reenviar",
      (req, res, next) => AuthMiddleware.validate(req as any, res, next),
      BodyMiddleware.validate,
      (req, res) =>
        new ReenviarController(
          new ReenviarService(
            CacheService.getInstance(),
            new ServicoRepository(),
            new TecnospeedClient(),
            new WebhookReprocessadoRepository(),
          ),
        ).reenviar(req as any, res),
    );
  }
}
