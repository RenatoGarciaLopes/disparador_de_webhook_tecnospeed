import { WebhookReprocessadoRepository } from "../../../infrastructure/database/repositories/WebHookReprocessadoRespository";
import { ProtocoloParamSchemaDTO } from "@/modules/protocolo/interfaces/http/validators/ProtocoloParamSchema";

export class GetProtocoloByIdUseCase {
  constructor(
    private readonly webhookReprocessadoRepository: WebhookReprocessadoRepository,
  ) {}

  async execute(data: ProtocoloParamSchemaDTO, cedenteId: number) {
    const webhookReprocessado =
      await this.webhookReprocessadoRepository.findById(data.id, cedenteId);
    return webhookReprocessado;
  }
}
