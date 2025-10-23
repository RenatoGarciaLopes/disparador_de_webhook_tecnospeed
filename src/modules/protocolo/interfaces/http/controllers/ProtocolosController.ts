import { Request, Response } from "express";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { ProtocolosService } from "../../../domain/services/ProtocolosService";
import { ErrorResponse } from "@/shared/errors/ErrorResponse";
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
      const protocolos = await this.service.getProtocolos(
        req.cedenteId,
        req.body,
      );
      return res.status(200).json(protocolos);
    } catch (error) {
      if (error instanceof InvalidFieldsError) {
        return res.status(error.status).json(error.json());
      }

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

      const protocoloParamDTO = new ProtocoloParamDTO({ id });

      const { cedenteId } = req;

      const protocolo = await this.service.getProtocoloById(
        cedenteId,
        protocoloParamDTO,
      );

      return res.status(200).json(protocolo);
    } catch (error) {
      if (error instanceof InvalidFieldsError) {
        return res.status(error.status).json(error.json());
      }

      return res
        .status(500)
        .json(
          ErrorResponse.internalServerErrorFromError(error as Error).json(),
        );
    }
  }
}
