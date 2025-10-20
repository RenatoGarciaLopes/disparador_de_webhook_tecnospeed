import { WebhookReprocessado } from "@/sequelize/models/webhookreprocessado.model";
import { GetProtocolosUseCase } from "../../application/use-cases/protocolo/GetProtocolosUseCase";
import { GetProtocoloByIdUseCase } from "../../application/use-cases/protocolo/GetProtocoloByIdUseCase";
import { ProtocolosSchemaDTO } from "../../interfaces/http/validators/ProtocolosSchema";
import { GetProtocoloByIdUseCase } from "../../application/use-cases/protocolo/GetProtocoloByIdUseCase";

export class GetProtocolosService {
  constructor(
    private readonly getProtocolosUseCase: GetProtocolosUseCase,
    private readonly getProtocoloByIdUseCase: GetProtocoloByIdUseCase,
  ) {}

  async getProtocolos(
    cedenteId: number,
    data: ProtocolosSchemaDTO,
  ): Promise<WebhookReprocessado[]> {
    try {
      return await this.getProtocolosUseCase.execute(data, cedenteId);
    } catch (error) {
      throw error;
    }
  }

  async getProtocoloById(
    cedenteId: number,
    data: ProtocoloParamSchemaDTO,
  ): Promise<WebhookReprocessado> {
    if (!data.id) {
      throw new Error("ID do protocolo é obrigatório");
    }

    try {
      const protocolo = await this.getProtocoloByIdUseCase.execute(
        data,
        cedenteId,
      );

      if (!protocolo) {
        throw new Error(`Protocolo com ID ${data.id} não encontrado`);
      }

      return protocolo;
    } catch (error) {
      throw error;
    }
  }
}
