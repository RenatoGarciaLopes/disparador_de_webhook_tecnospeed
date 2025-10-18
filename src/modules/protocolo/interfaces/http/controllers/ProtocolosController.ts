import { Request, Response } from "express";
import { ProtocolosSchemaDTO } from "../validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../validators/ProtocoloParamSchema";

export class ProtocolosController {
  public async getProtocolos(
    req: Request<{}, {}, ProtocolosSchemaDTO> & { cedenteId: number },
    res: Response,
  ) {
    try {
      res.status(200).json({});
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }

  public async getProtolocoById(
    req: Request<{}, {}, ProtocoloParamSchemaDTO> & { cedenteId: number },
    res: Response,
  ) {
    try {
      res.status(200).json({});
    } catch (error) {
      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }
}
