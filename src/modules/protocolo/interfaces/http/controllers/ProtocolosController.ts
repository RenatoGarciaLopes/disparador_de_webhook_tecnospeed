import { Request, Response } from "express";
import { ProtocolosSchemaDTO } from "../validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../validators/ProtocoloParamSchema";
import { InvalidFieldsError } from "@/shared/errors/InvalidFields";
import { GetProtocolosService } from "../../../domain/services/GetProtocolosService";
import { validateBody } from "../middlewares/protocolo/validate-body";

export class ProtocolosController {
  constructor(private service: GetProtocolosService) {}

  public async getProtocolos(
    req: Request<{}, {}, ProtocolosSchemaDTO> & { cedenteId: number },
    res: Response,
  ) {
    try {
      const bodyValidated = await validateBody(req.body);
      const protocolos = await this.service.getProtocolos(
        req.cedenteId,
        bodyValidated,
      );
      return res.status(200).json(protocolos);
    } catch (error) {
      if (error instanceof InvalidFieldsError) {
        return res
          .status(400)
          .json({ error: error.error, message: error.code });
      }
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  public async getProtolocoById(
    req: Request<{ id: string }, {}, ProtocoloParamSchemaDTO> & {
      cedenteId: number;
    },
    res: Response,
  ) {
    try {
      const { id } = req.params;
      const { cedenteId } = req;

      if (!id) {
        return res.status(400).json({ message: "UUID é obrigatório" });
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ message: "UUID inválido" });
      }

      const protocolo = await this.service.getProtocoloById(cedenteId, { id });

      if (!protocolo) {
        return res.status(400).json({ message: "Protocolo não encontrado." });
      }

      return res.status(200).json(protocolo);
    } catch (error) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
