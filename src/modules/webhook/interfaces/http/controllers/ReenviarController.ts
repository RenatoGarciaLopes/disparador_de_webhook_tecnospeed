import { Logger } from "@/infrastructure/logger/logger";
import { ReenviarService } from "@/modules/webhook/domain/services/ReenviarService";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { KINDS_REENVIOS } from "@/shared/utils/kind-reenvios";
import { Request, Response } from "express";
import { ReenviarDTO } from "../dtos/ReenviarDTO";

export class ReenviarController {
  constructor(private readonly reenviarService: ReenviarService) {}

  public async reenviar(
    req: Request<{}, {}, ReenviarDTO> & {
      softwareHouseId: number;
      cedenteId: number;
    },
    res: Response,
  ) {
    try {
      const { kind, product, type, id } = req.body;

      Logger.info(
        `Reenviar webhook request received: product=${product}, type=${type}, kind=${kind}, idsCount=${id?.length || 0}`,
      );

      if (!KINDS_REENVIOS.includes(kind)) {
        Logger.warn(`Unsupported kind requested: ${kind}`);
        return res.status(501).json(
          new ErrorResponse("NOT_IMPLEMENTED", 501, {
            errors: [`Apenas ${KINDS_REENVIOS.join(", ")} são suportados.`],
          }).json(),
        );
      }

      const response = await this.reenviarService[kind](req.body, {
        id: req.cedenteId,
        cnpj: req.headers["x-api-cnpj-cedente"] as string,
      });

      Logger.info(
        `Webhook reenvio completed successfully: protocolo=${response?.protocolo}`,
      );

      return res.status(200).json(response);
    } catch (error: unknown) {
      if (error instanceof InvalidFieldsError) {
        Logger.warn(`Validation error in reenviar request: ${error.code}`);
        return res.status(error.status).json(error.json());
      }

      Logger.error(
        `Unexpected error in reenviar request: ${error instanceof Error ? error.message : String(error)}`,
      );

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
