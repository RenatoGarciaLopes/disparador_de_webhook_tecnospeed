import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";
import { GetProtocoloByIdUseCase } from "../../application/use-cases/protocolo/GetProtocoloByIdUseCase";
import { ProtocolosSchemaDTO } from "../../interfaces/http/validators/ProtocolosSchema";
import { ProtocoloParamSchemaDTO } from "../../interfaces/http/validators/ProtocoloParamSchema";

export class GetProtocolosService {
  constructor(
    private readonly getProtocolosUseCase: GetProtocolosUseCase,
    private readonly getProtocoloByIdUseCase: GetProtocoloByIdUseCase,
  ) {}

  async getProtocolos(cedenteId: number, data: ProtocolosSchemaDTO) {
    return this.getProtocolosUseCase.execute(data, cedenteId);
  }

  async getProtocoloById(cedenteId: number, data: ProtocoloParamSchemaDTO) {
    return this.getProtocoloByIdUseCase.execute(data, cedenteId);
  }
}
