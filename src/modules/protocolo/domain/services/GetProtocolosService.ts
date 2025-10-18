import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";
import { ProtocoloParamSchemaDTO } from "../../interfaces/http/validators/ProtocoloParamSchema";
import { ProtocolosSchemaDTO } from "../../interfaces/http/validators/ProtocolosSchema";

export class GetProtocolosService {
  constructor(private readonly getProtocoloUseCase: GetProtocolosUseCase) {}

  async getProtocolos(cedenteId: number, data: ProtocolosSchemaDTO) {
    return [];
  }

  async getProtocoloById(cedenteId: number, data: ProtocoloParamSchemaDTO) {
    return [];
  }
}
