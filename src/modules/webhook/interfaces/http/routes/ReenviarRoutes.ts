import { validateAuthHeaders } from "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-auth-headers";
import { validateBody } from "@/modules/webhook/interfaces/http/middlewares/reenviar/validate-body";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { RouterImplementation } from "@/shared/RouterImplementation";
import { Request, Router } from "express";
import { ReenviarController } from "../controllers/ReenviarController";

export class ReenviarRoutes extends RouterImplementation {
  public static readonly PATH = "/reenviar";
  public readonly router = Router();

  constructor(private readonly controller: ReenviarController) {
    super();
    this.configure();
  }

  protected configure(): void {
    this.router.post(
      ReenviarRoutes.PATH,
      async (req: Request & { cedenteId?: number }, res, next) => {
        try {
          const headersValidated = await validateAuthHeaders(
            new Headers(req.headers as Record<string, string>),
          );
          const bodyValidated = await validateBody(req.body);

          req.body = bodyValidated;
          req.cedenteId = headersValidated.cedente.id;

          next();
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            return res.status(401).json(error.json());
          }
          if (error instanceof InvalidFieldsError) {
            return res.status(400).json(error.json());
          }
          return res
            .status(500)
            .json(ErrorResponse.internalServerErrorFromError(error as Error));
        }
      },
      (req, res) => this.controller.reenviar(req as any, res),
    );
  }
}
