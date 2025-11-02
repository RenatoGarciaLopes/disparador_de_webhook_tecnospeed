import { Logger } from "@/infrastructure/logger/logger";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { Request, Response } from "express";
import { ProtocolosService } from "../../../domain/services/ProtocolosService";
import {
  IProtocoloParamDTO,
  ProtocoloParamDTO,
} from "../dtos/ProtocoloParamDTO";
import { IProtocolosDTO } from "../dtos/ProtocolosDTO";

export class ProtocolosController {
  constructor(private service: ProtocolosService) {}

  public async getProtocolos(
    req: Request<{}, {}, IProtocolosDTO> & { cedenteId: number },
    res: Response,
  ) {
    try {
      const { product, id } = req.body;

      Logger.info(
        `Get protocolos request received: cedenteId=${req.cedenteId}, product=${product}, idsCount=${id?.length || 0}`,
      );

      const protocolos = await this.service.getProtocolos(
        req.cedenteId,
        req.body,
      );

      Logger.info(
        `Protocolos retrieved successfully: total=${protocolos.pagination?.total || 0}, pages=${protocolos.pagination?.total_pages || 0}`,
      );

      return res.status(200).json(protocolos);
    } catch (error) {
      if (error instanceof InvalidFieldsError) {
        Logger.warn(`Validation error in getProtocolos: ${error.code}`);
        return res.status(error.status).json(error.json());
      }

      Logger.error(
        `Unexpected error in getProtocolos: ${error instanceof Error ? error.message : String(error)}`,
      );

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }

  public async getProtolocoById(
    req: Request<{ id: string }, {}, IProtocoloParamDTO> & {
      cedenteId: number;
    },
    res: Response,
  ) {
    try {
      const { id } = req.params;

      Logger.info(
        `Get protocolo by id request received: id=${id}, cedenteId=${req.cedenteId}`,
      );

      const protocoloParamDTO = new ProtocoloParamDTO({ id });

      const { cedenteId } = req;

      const protocolo = await this.service.getProtocoloById(
        cedenteId,
        protocoloParamDTO,
      );

      Logger.info(
        `Protocolo retrieved successfully: id=${id}, product=${protocolo?.product}`,
      );

      return res.status(200).json(protocolo);
    } catch (error) {
      if (error instanceof InvalidFieldsError) {
        Logger.warn(`Validation error in getProtocoloById: ${error.code}`);
        return res.status(error.status).json(error.json());
      }

      if (error instanceof ErrorResponse && error.statusCode === 400) {
        Logger.warn(
          `Protocolo not found: id=${req.params.id}, cedenteId=${req.cedenteId}`,
        );
        return res.status(error.statusCode).json(error.json());
      }

      Logger.error(
        `Unexpected error in getProtocoloById: ${error instanceof Error ? error.message : String(error)}`,
      );

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
