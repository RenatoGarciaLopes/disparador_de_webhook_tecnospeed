import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { UnauthorizedError } from "@/shared/errors/Unauthorized";
import { RouterImplementation } from "@/shared/RouterImplementation";
import { Request, Router } from "express";
import { ProtocolosController } from "../controllers/ProtocolosController";
import { validateAuthHeaders } from "../middlewares/protocolo/validate-auth-headers";
import { validateBody } from "../middlewares/protocolo/validate-body";

export class ProtocolosRoutes extends RouterImplementation {
  public static readonly PATH = "/protocolo";
  public readonly router = Router();

  constructor(private readonly controller: ProtocolosController) {
    super();
    this.configure();
  }

  protected configure(): void {
    this.router.get(
      ProtocolosRoutes.PATH,
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
          return res.status(500).json(
            new ErrorResponse("Erro interno do servidor", 500, {
              errors: [(error as Error).message ?? "Erro interno do servidor"],
            }),
          );
        }
      },
      (req, res) =>
        this.controller.getProtocolos(
          req as Request & { cedenteId: number },
          res,
        ),
    );

    this.router.get(
      ProtocolosRoutes.PATH + "/:id",
      async (req: Request & { cedenteId?: number }, res, next) => {
        try {
          const headersValidated = await validateAuthHeaders(
            new Headers(req.headers as Record<string, string>),
          );

          req.cedenteId = headersValidated.cedente.id;

          next();
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            return res.status(401).json(error.json());
          }
          return res.status(500).json(
            new ErrorResponse("Erro interno do servidor", 500, {
              errors: [(error as Error).message ?? "Erro interno do servidor"],
            }),
          );
        }
      },
      (req, res) =>
        this.controller.getProtolocoById(
          req as Request & { cedenteId: number },
          res,
        ),
    );
  }
}
