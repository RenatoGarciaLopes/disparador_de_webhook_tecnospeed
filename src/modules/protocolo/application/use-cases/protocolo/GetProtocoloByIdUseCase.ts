import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { ProtocoloParamSchemaDTO } from "@/modules/protocolo/interfaces/http/validators/ProtocoloParamSchema";

export class GetProtocoloByIdUseCase {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
  ) {}

  async execute(data: ProtocoloParamSchemaDTO, cedenteId: number) {
    if (!data.id) {
      throw new Error("ID do protocolo é obrigatório");
    }

    const webhookReprocessado =
      await this.webhookReprocessadoRepository.findById(data.id, cedenteId);

    if (!webhookReprocessado) {
      throw new Error("Protocolo não encontrado.");
    }

    return webhookReprocessado;
  }
}
